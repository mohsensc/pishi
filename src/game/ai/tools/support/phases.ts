import type { CatMind, StepContext } from '../../../memory'
import type { CatState, HeldToyState, Vec } from '../../../types'
import { faceToward } from '../../helpers/pose'
import { beginBehavior } from '../../helpers/transitions'

const committedUrgency = 3.1

export function commit(mind: CatMind): void {
  mind.behaviorUrgency = Math.max(mind.behaviorUrgency, committedUrgency - 0.05)
}

export function enterPhase(mind: CatMind, phase: string, hold = 0): void {
  mind.phase = phase
  mind.phaseTimer = 0
  mind.holdDuration = hold
}

export function phaseDone(mind: CatMind): boolean {
  return mind.phaseTimer >= mind.holdDuration
}

function toyScreenPoint(toy: HeldToyState): Vec {
  return { x: toy.position.x, y: toy.position.y - toy.height }
}

export function gazeAtToy(cat: CatState, mind: CatMind, toy: HeldToyState): void {
  mind.scratchPoints.gaze = toyScreenPoint(toy)
  faceToward(cat, mind, toy.position, 0.4)
}

export function gazeAt(cat: CatState, mind: CatMind, point: Vec, hold = 0.4): void {
  mind.scratchPoints.gaze = { x: point.x, y: point.y }
  faceToward(cat, mind, point, hold)
}

export function every(mind: CatMind, context: StepContext, key: string, interval: number): boolean {
  const remaining = (mind.scratchNumbers[key] ?? interval * context.memory.random.range(0.3, 1)) - context.dt
  if (remaining > 0) {
    mind.scratchNumbers[key] = remaining
    return false
  }
  mind.scratchNumbers[key] = interval * context.memory.random.range(0.8, 1.2)
  return true
}

export function chain(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string, urgency = committedUrgency, duration?: number): void {
  beginBehavior(cat, mind, context, behaviorId, duration === undefined ? { urgency } : { urgency, duration })
}
