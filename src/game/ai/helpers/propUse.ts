import type { CatMind, StepContext } from '../../memory'
import { clamp, distance } from '../../vector'
import type { CatState, PropKind, PropState, Vec, World } from '../../types'
import { emergeFrom } from './hiding'
import { dismount } from './perch'
import { faceToward, setEmote } from './pose'
import { findProp, randomTimer, weightedPick, zeroVector } from './queries'
import { arrive, brake } from './steering'
import { threatened, topSpeed } from './threat'
import { beginFlee, endBehavior } from './transitions'

const travelTimeLimit = 10
const travelUrgency = 1.2

export function nightness(world: World): number {
  return clamp(Math.cos(world.dayTime * Math.PI * 2) * 1.4 + 0.2, 0, 1)
}

export function candidateProps(
  cat: CatState,
  context: StepContext,
  kinds: readonly PropKind[],
  maxDistance: number,
  filter: (prop: PropState) => boolean = () => true,
): PropState[] {
  const reach = maxDistance * context.memory.sizeScale
  return context.world.props.filter((prop) => kinds.includes(prop.kind) && distance(cat.position, prop.position) < reach && filter(prop))
}

export function hasProp(
  cat: CatState,
  context: StepContext,
  kinds: readonly PropKind[],
  maxDistance: number,
  filter: (prop: PropState) => boolean = () => true,
): boolean {
  return candidateProps(cat, context, kinds, maxDistance, filter).length > 0
}

export function pickProp(
  cat: CatState,
  context: StepContext,
  kinds: readonly PropKind[],
  maxDistance: number,
  filter: (prop: PropState) => boolean = () => true,
): PropState | undefined {
  const options = candidateProps(cat, context, kinds, maxDistance, filter)
  const scaled = 160 * context.memory.sizeScale
  return weightedPick(context, options.map((prop): [PropState, number] => [prop, 1 / (1 + distance(cat.position, prop.position) / scaled)])) ?? undefined
}

export function usersOf(context: StepContext, propId: string, excludeId: string | null, behaviorIds: readonly string[] | null = null): CatState[] {
  return context.world.cats.filter((other) => {
    if (other.id === excludeId) return false
    if (behaviorIds && !behaviorIds.includes(other.behavior)) return false
    const otherMind = context.memory.minds.get(other.id)
    return otherMind?.propTargetId === propId && (other.intent === 'useProp' || other.intent === 'hide' || other.intent === 'napping')
  })
}

export function isPropBusy(context: StepContext, prop: PropState, catId: string, capacity = 1): boolean {
  return usersOf(context, prop.id, catId).length >= capacity || prop.occupantIds.some((id) => id !== catId)
}

export function enterPhase(mind: CatMind, phase: string, hold = 0): void {
  mind.phase = phase
  mind.phaseTimer = 0
  mind.holdDuration = hold
}

export function quit(cat: CatState, mind: CatMind, context: StepContext): Vec {
  endBehavior(cat, mind, context)
  return zeroVector
}

export function travel(cat: CatState, mind: CatMind, context: StepContext, target: Vec, speedFactor: number, arrival = 12): Vec | null {
  if (distance(cat.position, target) < arrival * cat.coat.scale) return null
  if (mind.phaseTimer > travelTimeLimit) return quit(cat, mind, context)
  mind.behaviorUrgency = Math.max(mind.behaviorUrgency, travelUrgency)
  return arrive(cat, target, topSpeed(cat, mind, context) * speedFactor, 40)
}

const committedUrgency = 1.5

export function commit(mind: CatMind): void {
  mind.behaviorUrgency = Math.max(mind.behaviorUrgency, committedUrgency)
}

export function settleAt(cat: CatState, mind: CatMind, context: StepContext, lookAt: Vec, phase: string, holdMin: number, holdMax: number): Vec {
  faceToward(cat, mind, lookAt, 0.8)
  commit(mind)
  enterPhase(mind, phase, randomTimer(context, holdMin, holdMax))
  cat.intentTimer = Math.max(cat.intentTimer, mind.holdDuration + 0.5)
  return brake(cat)
}

export function finishUse(cat: CatState, mind: CatMind, context: StepContext): Vec {
  if (mind.leap) return zeroVector
  if (cat.hidden) {
    const prop = findProp(context, cat.propId)
    if (prop) emergeFrom(cat, prop, context)
    else cat.hidden = false
    return quit(cat, mind, context)
  }
  if (cat.height > 1) {
    dismount(cat, mind, context, 'ground')
    return zeroVector
  }
  return quit(cat, mind, context)
}

export function releaseProp(cat: CatState, mind: CatMind, context: StepContext): void {
  mind.idlePose = 'sit'
  if (cat.hidden) {
    const prop = findProp(context, cat.propId)
    if (prop) emergeFrom(cat, prop, context)
    cat.hidden = false
  }
  if (mind.perch) {
    mind.perch = null
    cat.propId = null
  }
}

export function bailIfThreatened(cat: CatState, mind: CatMind, context: StepContext, factor = 0.9): boolean {
  if (mind.leap || !threatened(cat, mind, context, factor)) return false
  setEmote(cat, 'startled')
  if (cat.height > 1) dismount(cat, mind, context, 'ground')
  else beginFlee(cat, mind, context, randomTimer(context, 1.2, 2))
  return true
}

export function isOvertime(cat: CatState): boolean {
  return cat.intentTimer < -6
}

export function bumpAgitation(prop: PropState, amount: number): void {
  prop.agitation = Math.max(prop.agitation, amount)
}

export function parkNovelty(behaviorId: string, context: StepContext, horizon = 35, ceiling = 3): number {
  let latest = Number.NEGATIVE_INFINITY
  context.memory.minds.forEach((mind) => {
    mind.recentBehaviors.forEach((record) => {
      if (record.id === behaviorId && record.startedAt > latest) latest = record.startedAt
    })
  })
  const idle = Number.isFinite(latest) ? context.world.time - latest : context.world.time
  return 1 + Math.min(ceiling, Math.max(0, idle) / horizon)
}
