import type { CatMind, StepContext } from '../../memory'
import { add, length, normalize, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { startLeap } from './leap'
import { catRadius, randomOpenPoint } from './queries'
import { resolveCollisions } from './steering'

const stuckLimitSeconds = 0.45

function escapeHeading(cat: CatState, desired: Vec): Vec {
  if (length(desired) > 1) return normalize(desired)
  return { x: cat.facing, y: 0 }
}

export function freeIfStuck(cat: CatState, mind: CatMind, context: StepContext, desired: Vec): boolean {
  if (mind.stuckSeconds < stuckLimitSeconds || mind.leap || cat.height > 1 || cat.hidden) return false
  mind.stuckSeconds = 0
  const scaleFactor = context.memory.sizeScale
  const aim = add(cat.position, scale(escapeHeading(cat, desired), 70 * scaleFactor))
  const landing = randomOpenPoint(context, aim, 60 * scaleFactor, catRadius(cat) + 4)
  mind.target = null
  startLeap(cat, mind, context, landing, 0, 26 + 18 * mind.personality.jumpPower, 0.42, 'jump', 'none')
  return true
}

export function hopClearOfProps(cat: CatState, mind: CatMind, context: StepContext): void {
  if (mind.leap || cat.hidden || cat.height > 3) return
  const probe: CatState = { ...cat, position: { ...cat.position }, velocity: { ...cat.velocity } }
  resolveCollisions(probe, context)
  if (length(subtract(probe.position, cat.position)) < 6) return
  startLeap(cat, mind, context, probe.position, 0, 20, 0.32, 'hop', 'none')
}
