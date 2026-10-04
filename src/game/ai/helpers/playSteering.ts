import { clampToBounds, type LawnBounds } from '../../bounds'
import type { CatMind, StepContext } from '../../memory'
import { distance, normalize, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { zeroVector } from './queries'
import { seek } from './steering'
import { topSpeed } from './threat'
import { endBehavior } from './transitions'

export type CurveFunction = (progress: number) => Vec

export function enterPhase(mind: CatMind, phase: string, hold = 0): void {
  mind.phase = phase
  mind.phaseTimer = 0
  mind.holdDuration = hold
}

export function phaseDone(mind: CatMind): boolean {
  return mind.phaseTimer > mind.holdDuration
}

export function finishBehavior(cat: CatState, mind: CatMind, context: StepContext): Vec {
  endBehavior(cat, mind, context)
  return zeroVector
}

export function paceSpeed(cat: CatState, mind: CatMind, context: StepContext, fraction: number): number {
  return topSpeed(cat, mind, context) * fraction
}

export function sizeScaled(context: StepContext, value: number): number {
  return value * context.memory.sizeScale
}

export function followCurve(cat: CatState, mind: CatMind, context: StepContext, curve: CurveFunction, speed: number, lead = 26): Vec {
  let progress = mind.scratchNumbers.curveProgress ?? 0
  let carrot = clampToBounds(curve(progress), context.bounds)
  for (let step = 0; step < 40 && distance(cat.position, carrot) < lead; step += 1) {
    progress += 0.004
    carrot = clampToBounds(curve(progress), context.bounds)
  }
  mind.scratchNumbers.curveProgress = progress
  return seek(cat, carrot, speed)
}

export function curveProgress(mind: CatMind): number {
  return mind.scratchNumbers.curveProgress ?? 0
}

export function roomyAnchor(context: StepContext, around: Vec, spanX: number, spanY: number): Vec {
  const bounds = context.bounds
  const halfWidth = Math.min(spanX, (bounds.right - bounds.left) / 2 - 4)
  const halfHeight = Math.min(spanY, (bounds.bottom - bounds.top) / 2 - 4)
  return {
    x: Math.min(Math.max(around.x, bounds.left + halfWidth), bounds.right - halfWidth),
    y: Math.min(Math.max(around.y, bounds.top + halfHeight), bounds.bottom - halfHeight),
  }
}

export function perimeterPoint(bounds: LawnBounds, inset: number, progress: number): Vec {
  const left = bounds.left + inset
  const right = Math.max(left + 1, bounds.right - inset)
  const top = bounds.top + inset
  const bottom = Math.max(top + 1, bounds.bottom - inset)
  const width = right - left
  const height = bottom - top
  const perimeter = 2 * (width + height)
  let travel = (((progress % 1) + 1) % 1) * perimeter
  if (travel < width) return { x: left + travel, y: top }
  travel -= width
  if (travel < height) return { x: right, y: top + travel }
  travel -= height
  if (travel < width) return { x: right - travel, y: bottom }
  travel -= width
  return { x: left, y: bottom - travel }
}

export function perimeterProgressNear(bounds: LawnBounds, inset: number, point: Vec): number {
  let best = 0
  let bestGap = Number.POSITIVE_INFINITY
  for (let sample = 0; sample < 64; sample += 1) {
    const progress = sample / 64
    const gap = distance(point, perimeterPoint(bounds, inset, progress))
    if (gap < bestGap) {
      bestGap = gap
      best = progress
    }
  }
  return best
}

export function lateralWiggle(cat: CatState, amplitude: number, frequency: number): Vec {
  return { x: Math.sin(cat.clock * frequency * Math.PI * 2) * amplitude, y: 0 }
}

export function directionTo(from: Vec, to: Vec): Vec {
  return normalize(subtract(to, from))
}

export function pointToward(from: Vec, to: Vec, reach: number): Vec {
  const direction = directionTo(from, to)
  return { x: from.x + direction.x * reach, y: from.y + direction.y * reach }
}

export function headingVelocity(heading: Vec, speed: number): Vec {
  return scale(normalize(heading), speed)
}

export function isNight(context: StepContext): boolean {
  const time = context.world.dayTime
  return time > 0.8 || time < 0.18
}

export function isDusk(context: StepContext): boolean {
  const time = context.world.dayTime
  return time > 0.66 && time < 0.8
}

export function edgeBounce(cat: CatState, heading: Vec, context: StepContext, margin: number): { heading: Vec; bounced: boolean } {
  const bounds = context.bounds
  let { x, y } = heading
  let bounced = false
  if (cat.position.x < bounds.left + margin && x < 0) {
    x = -x
    bounced = true
  }
  if (cat.position.x > bounds.right - margin && x > 0) {
    x = -x
    bounced = true
  }
  if (cat.position.y < bounds.top + margin && y < 0) {
    y = -y
    bounced = true
  }
  if (cat.position.y > bounds.bottom - margin && y > 0) {
    y = -y
    bounced = true
  }
  return { heading: { x, y }, bounced }
}

export function pointerCalm(context: StepContext, maxSpeed = 260): boolean {
  const pointer = context.pointer
  return pointer.active && Math.hypot(pointer.velocity.x, pointer.velocity.y) < maxSpeed
}
