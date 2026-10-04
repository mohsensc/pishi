import type { StepContext } from '../memory'
import type { World } from '../types'
import { careBaseWeights, careItemKinds, CARE_METER_GOAL, CARE_TRAY_CAPACITY, catchPoints } from './careCatalog'
import type { CareDemandProvider, CareItem, CareItemKind, CareReward, CareState, CatchKind } from './careTypes'

const fullMeter = 1 - 1e-6
const hungryFullness = 0.4
const lonelyAffection = 0.3

const demandProviders: CareDemandProvider[] = []

export function createCareState(): CareState {
  return { meter: 0, inventory: [], lastReward: null, serial: 0 }
}

export function registerCareDemand(provider: CareDemandProvider): () => void {
  demandProviders.push(provider)
  return () => {
    const index = demandProviders.indexOf(provider)
    if (index >= 0) demandProviders.splice(index, 1)
  }
}

function builtInDemand(context: StepContext): Partial<Record<CareItemKind, number>> {
  const visible = context.world.cats.filter((cat) => !cat.hidden)
  const total = Math.max(1, visible.length)
  const hungry = visible.filter((cat) => cat.fullness < hungryFullness).length / total
  const lonely = visible.filter((cat) => cat.affection < lonelyAffection).length / total
  return { fish: hungry * 1.5, brush: lonely * 1.5 }
}

export function careItemWeights(context: StepContext): Record<CareItemKind, number> {
  const demands = [builtInDemand(context), ...demandProviders.map((provider) => provider(context))]
  const weights = { ...careBaseWeights }
  careItemKinds.forEach((kind) => {
    const demand = demands.reduce((sum, entry) => sum + Math.max(0, entry[kind] ?? 0), 0)
    weights[kind] = careBaseWeights[kind] * (1 + demand)
  })
  return weights
}

function pickUnlockKind(context: StepContext): CareItemKind {
  const weights = careItemWeights(context)
  const total = careItemKinds.reduce((sum, kind) => sum + weights[kind], 0)
  let roll = context.memory.random.next() * total
  for (const kind of careItemKinds) {
    roll -= weights[kind]
    if (roll <= 0) return kind
  }
  return careItemKinds[0]
}

export function isTrayFull(world: World): boolean {
  return world.care.inventory.length >= CARE_TRAY_CAPACITY
}

export function unlockCareItem(context: StepContext, kind: CareItemKind = pickUnlockKind(context)): CareItem | null {
  const { world } = context
  if (isTrayFull(world)) return null
  world.care.serial += 1
  const item: CareItem = { id: `care-${world.care.serial}`, kind, unlockedAt: world.time }
  world.care.inventory = [...world.care.inventory, item]
  return item
}

export function settleCareMeter(context: StepContext): CareItemKind | null {
  const { care } = context.world
  if (care.meter < fullMeter || isTrayFull(context.world)) return null
  const item = unlockCareItem(context)
  if (!item) return null
  care.meter = Math.max(0, care.meter - 1)
  return item.kind
}

export function grantCatchReward(context: StepContext, catchKind: CatchKind): CareReward {
  const { world } = context
  const points = catchPoints[catchKind]
  world.care.meter = Math.min(isTrayFull(world) ? 1 : 2, world.care.meter + points / CARE_METER_GOAL)
  const unlockedKind = settleCareMeter(context)
  if (isTrayFull(world)) world.care.meter = Math.min(1, world.care.meter)
  world.care.serial += 1
  const reward: CareReward = { id: `reward-${world.care.serial}`, catchKind, points, unlockedKind, time: world.time }
  world.care.lastReward = reward
  return reward
}

export function takeCareItem(world: World, kind: CareItemKind): CareItem | null {
  const item = world.care.inventory.find((candidate) => candidate.kind === kind)
  if (!item) return null
  world.care.inventory = world.care.inventory.filter((candidate) => candidate !== item)
  return item
}
