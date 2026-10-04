import { clampToBounds } from '../../../bounds'
import type { StepContext } from '../../../memory'
import type { CatState, PropState, Vec } from '../../../types'
import { catRadius } from '../../helpers/queries'

export type StationSlot = 'kibbleSide' | 'kibbleTop' | 'water'

export interface SlotSpot {
  point: Vec
  facing: 1 | -1
  bowl: Vec
}

export function feedingStationOf(context: StepContext): PropState | undefined {
  return context.world.props.find((prop) => prop.kind === 'feedingStation')
}

export function slotSpot(station: PropState, slot: StationSlot, cat: CatState, context: StepContext): SlotSpot {
  const reach = station.radius + catRadius(cat) + 2
  const kibble = { x: station.position.x - station.radius * 0.48, y: station.position.y }
  const water = { x: station.position.x + station.radius * 0.48, y: station.position.y }
  if (slot === 'kibbleSide') return { point: clampToBounds({ x: station.position.x - reach, y: station.position.y + 2 }, context.bounds), facing: 1, bowl: kibble }
  if (slot === 'kibbleTop') {
    const dx = -station.radius * 0.85
    const dy = -Math.sqrt(Math.max(0, reach * reach - dx * dx))
    return { point: clampToBounds({ x: station.position.x + dx, y: station.position.y + dy }, context.bounds), facing: 1, bowl: kibble }
  }
  const dx = station.radius * 0.75
  const dy = -Math.sqrt(Math.max(0, reach * reach - dx * dx))
  return { point: clampToBounds({ x: station.position.x + dx, y: station.position.y + dy }, context.bounds), facing: -1, bowl: water }
}

export function slotTakenBy(context: StepContext, slot: StationSlot, selfId: string): boolean {
  return context.world.cats.some((other) => {
    if (other.id === selfId) return false
    if (other.behavior !== 'goEat' && other.behavior !== 'drinkWater') return false
    return context.memory.minds.get(other.id)?.scratchIds.slot === slot
  })
}

export function freeKibbleSlot(context: StepContext, selfId: string): StationSlot | null {
  const slots: StationSlot[] = ['kibbleSide', 'kibbleTop']
  return slots.find((slot) => !slotTakenBy(context, slot, selfId)) ?? null
}

export function queueSpot(station: PropState, cat: CatState, index: number, context: StepContext): Vec {
  const spacing = 34 * cat.coat.scale
  const base = { x: station.position.x - station.radius * 2.4 - index * spacing, y: station.position.y - station.radius * 0.4 + (index % 2) * spacing * 0.6 }
  return clampToBounds(base, context.bounds)
}
