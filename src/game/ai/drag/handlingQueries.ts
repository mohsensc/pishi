import type { CatMind, StepContext } from '../../memory'
import { distance } from '../../vector'
import type { BallState, CatState, PropState, Vec } from '../../types'

const handlingBehaviorIds = new Set(['handledLanding', 'watchCarried', 'investigateDrop', 'watchThrow', 'fetchRace', 'fetchReturn'])

const thrownWindow = 2.6
const dropWindow = 3.5

export function isFreeForHandling(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (cat.hidden || cat.height > 1 || mind.leap || cat.heldBallId || cat.propId || cat.followUntil !== null) return false
  if (handlingBehaviorIds.has(cat.behavior)) return false
  const drag = context.world.drag
  return !(drag && drag.target === 'cat' && drag.id === cat.id)
}

export function carriedScreenPoint(context: StepContext): Vec | null {
  const drag = context.world.drag
  if (!drag) return null
  return { x: drag.pointer.x, y: drag.pointer.y }
}

export function carriedGroundPoint(context: StepContext): Vec | null {
  const drag = context.world.drag
  if (!drag) return null
  return { x: drag.pointer.x - drag.grabOffset.x, y: drag.pointer.y - drag.grabOffset.y + drag.lift }
}

export function isThrownBall(ball: BallState, context: StepContext): boolean {
  if (ball.status !== 'loose' || ball.thrownAt === null) return false
  const drag = context.world.drag
  if (drag && drag.target === 'ball' && drag.id === ball.id) return false
  return context.world.time - ball.thrownAt < thrownWindow
}

export function freshThrownBall(cat: CatState, context: StepContext, radius: number): BallState | undefined {
  let best: BallState | undefined
  let bestGap = radius
  context.world.balls.forEach((ball) => {
    if (!isThrownBall(ball, context)) return
    const gap = distance(ball.position, cat.position)
    if (gap < bestGap) {
      bestGap = gap
      best = ball
    }
  })
  return best
}

export function freshDrop(cat: CatState, context: StepContext, radius: number): PropState | undefined {
  const { world } = context
  return world.props.find((prop) => {
    if (prop.droppedAt === null || world.time - prop.droppedAt > dropWindow) return false
    if (world.drag?.target === 'prop' && world.drag.id === prop.id) return false
    return distance(prop.position, cat.position) < radius
  })
}

export function doingWith(context: StepContext, behaviorId: string, key: string, id: string, excludeId: string): number {
  return context.world.cats.filter((other) => {
    if (other.id === excludeId || other.behavior !== behaviorId) return false
    return context.memory.minds.get(other.id)?.scratchIds[key] === id
  }).length
}
