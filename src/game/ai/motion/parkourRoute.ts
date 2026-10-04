import { perchLevelsOf } from '../../layout'
import type { CatMind, PerchSpot, StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState, PropKind, PropState } from '../../types'
import { startLeap } from '../helpers/leap'
import { isPerchSpotTaken, perchSpotFor } from '../helpers/perch'

const parkourKinds: readonly PropKind[] = ['bench', 'cardboardBox', 'catTree', 'rock']
const firstHopReach = 420
const nextHopReach = 300

function isUsable(prop: PropState, cat: CatState): boolean {
  if (!parkourKinds.includes(prop.kind) || prop.lift > 0) return false
  return prop.occupantIds.every((id) => id === cat.id)
}

function freeSpotOn(prop: PropState, cat: CatState, mind: CatMind, context: StepContext, preferHigh: boolean): PerchSpot | null {
  const levels = perchLevelsOf(prop, context.world.height)
  const reachable = prop.kind === 'catTree' ? Math.min(levels.length, mind.personality.climbLevels) : levels.length
  const offset = preferHigh ? 0 : context.memory.random.integer(0, Math.max(0, reachable - 1))
  const order = Array.from({ length: reachable }, (_, index) => (preferHigh ? reachable - 1 - index : (index + offset) % reachable))
  for (const level of order) {
    if (isPerchSpotTaken(context, prop.id, level, cat.id)) continue
    const spot = perchSpotFor(prop, level, context.world.height)
    if (spot) return spot
  }
  return null
}

export function planParkourRoute(cat: CatState, mind: CatMind, context: StepContext, stops: number): PerchSpot[] {
  const scale = context.memory.sizeScale
  const route: PerchSpot[] = []
  const visited = new Set<string>()
  let anchor = cat.position
  for (let index = 0; index < stops; index += 1) {
    const reach = (index === 0 ? firstHopReach : nextHopReach) * scale
    const options = context.world.props.filter((prop) => !visited.has(prop.id) && isUsable(prop, cat) && distance(anchor, prop.position) < reach)
    if (options.length === 0) break
    const prop = context.memory.random.pick(options)
    const spot = freeSpotOn(prop, cat, mind, context, index === stops - 1)
    if (!spot) break
    route.push(spot)
    visited.add(prop.id)
    anchor = prop.position
  }
  return route
}

export function hasParkourRoute(cat: CatState, context: StepContext): boolean {
  const scale = context.memory.sizeScale
  const near = context.world.props.filter((prop) => isUsable(prop, cat) && distance(cat.position, prop.position) < firstHopReach * scale)
  return near.some((prop) => context.world.props.some((other) => other.id !== prop.id && isUsable(other, cat) && distance(prop.position, other.position) < nextHopReach * scale))
}

export function leapToSpot(cat: CatState, mind: CatMind, context: StepContext, spot: PerchSpot, pose: 'jump' | 'pounce'): void {
  mind.perch = spot
  cat.propId = spot.propId
  const gap = distance(cat.position, spot.spot)
  const rise = spot.height - cat.height
  const power = Math.pow(mind.personality.jumpPower, 0.3)
  const duration = (0.28 + gap / 820 + Math.abs(rise) / 700) / power
  const peak = 14 + Math.max(0, rise) * 0.25 + gap * 0.08
  startLeap(cat, mind, context, spot.spot, spot.height, peak, duration, pose, 'climb')
}
