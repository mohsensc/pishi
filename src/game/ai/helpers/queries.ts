import { boundsCenter, clampToBounds, pushOutOfDock } from '../../bounds'
import { CAT_BODY_LENGTH, MAX_HIDDEN_CATS, MIN_VISIBLE_CATS, POND_ASPECT } from '../../constants'
import type { CatMind, StepContext } from '../../memory'
import { isInPond, pondReach } from '../../physics'
import { add, closestOnSegment, distance, distanceToSegment, length, normalize, scale, subtract } from '../../vector'
import type { BallState, ButterflyState, CatState, PropKind, PropState, Vec } from '../../types'

export const zeroVector: Vec = { x: 0, y: 0 }

export function mindOf(cat: CatState, context: StepContext): CatMind {
  const mind = context.memory.minds.get(cat.id)
  if (!mind) throw new Error(`missing mind for ${cat.id}`)
  return mind
}

export function catRadius(cat: CatState): number {
  return 12 * cat.coat.scale
}

export function bodyLength(cat: CatState): number {
  return CAT_BODY_LENGTH * cat.coat.scale
}

export function catCenter(cat: CatState): Vec {
  return { x: cat.position.x, y: cat.position.y - cat.height - 16 * cat.coat.scale }
}

export function mouthPoint(cat: CatState): Vec {
  return { x: cat.position.x + cat.facing * bodyLength(cat) * 0.46, y: cat.position.y + 1 }
}

export function randomTimer(context: StepContext, minimum: number, maximum: number): number {
  return context.memory.random.range(minimum, maximum)
}

export function hiddenAllowance(cats: CatState[]): number {
  return Math.min(MAX_HIDDEN_CATS, cats.length - MIN_VISIBLE_CATS)
}

export function canHideMore(context: StepContext): boolean {
  const { cats } = context.world
  return cats.filter((cat) => cat.hidden).length < hiddenAllowance(cats)
}

export function findBall(context: StepContext, id: string | null): BallState | undefined {
  return id ? context.world.balls.find((ball) => ball.id === id) : undefined
}

export function findProp(context: StepContext, id: string | null): PropState | undefined {
  return id ? context.world.props.find((prop) => prop.id === id) : undefined
}

export function findCat(context: StepContext, id: string | null): CatState | undefined {
  return id ? context.world.cats.find((cat) => cat.id === id) : undefined
}

export function findButterfly(context: StepContext, id: string | null): ButterflyState | undefined {
  return id ? context.world.butterflies.find((butterfly) => butterfly.id === id) : undefined
}

export function nearestProp(
  cat: CatState,
  context: StepContext,
  kind: PropKind,
  maxDistance: number,
  filter: (prop: PropState) => boolean = () => true,
): PropState | undefined {
  let best: PropState | undefined
  let bestGap = maxDistance
  context.world.props.forEach((prop) => {
    if (prop.kind !== kind || !filter(prop)) return
    const gap = distance(cat.position, prop.position)
    if (gap < bestGap) {
      bestGap = gap
      best = prop
    }
  })
  return best
}

export function propsWithin(point: Vec, context: StepContext, radius: number, filter: (prop: PropState) => boolean = () => true): PropState[] {
  return context.world.props.filter((prop) => filter(prop) && distance(prop.position, point) < radius + prop.radius)
}

export function catsWithin(point: Vec, context: StepContext, radius: number, excludeId: string | null = null): CatState[] {
  return context.world.cats.filter((other) => other.id !== excludeId && !other.hidden && distance(other.position, point) < radius)
}

export function nearestButterfly(cat: CatState, context: StepContext, maxDistance: number): ButterflyState | undefined {
  let best: ButterflyState | undefined
  let bestGap = maxDistance
  context.world.butterflies.forEach((butterfly) => {
    const gap = distance(cat.position, butterfly.position)
    if (gap < bestGap) {
      bestGap = gap
      best = butterfly
    }
  })
  return best
}

export function weightedPick<Option>(context: StepContext, options: [Option, number][]): Option | null {
  const total = options.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0)
  if (total <= 0) return null
  let roll = context.memory.random.next() * total
  for (const [option, weight] of options) {
    roll -= Math.max(0, weight)
    if (roll <= 0 && weight > 0) return option
  }
  const last = [...options].reverse().find(([, weight]) => weight > 0)
  return last ? last[0] : null
}

export function isOpenGround(point: Vec, context: StepContext, clearance: number): boolean {
  if (isInPond(context.world.props, point, 1.15)) return false
  return !context.world.props.some((prop) => {
    if (prop.solid && distance(prop.position, point) < prop.radius + clearance) return true
    if (prop.tunnelExit && distanceToSegment(point, prop.position, prop.tunnelExit) < prop.radius + clearance) return true
    return false
  })
}

export function randomOpenPoint(context: StepContext, around: Vec | null, reach: number, clearance: number): Vec {
  const random = context.memory.random
  const bounds = context.bounds
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const candidate = around
      ? { x: around.x + random.range(-reach, reach), y: around.y + random.range(-reach, reach) * 0.7 }
      : { x: random.range(bounds.left, bounds.right), y: random.range(bounds.top, bounds.bottom) }
    const point = pushOutOfDock(clampToBounds(candidate, bounds), context.world.width, context.world.height)
    if (isOpenGround(point, context, clearance)) return point
  }
  return clampToBounds(around ?? boundsCenter(bounds), bounds)
}

export function pushOutOfPond(point: Vec, pond: PropState, radius: number, fallback: Vec): Vec {
  const limitReach = 1 + radius / pond.radius
  if (pondReach(pond, point) >= limitReach) return point
  const offset = subtract(point, pond.position)
  const direction = normalize({ x: offset.x / pond.radius, y: offset.y / (pond.radius * POND_ASPECT) })
  const safe = direction.x === 0 && direction.y === 0 ? fallback : direction
  return { x: pond.position.x + safe.x * pond.radius * limitReach, y: pond.position.y + safe.y * pond.radius * POND_ASPECT * limitReach }
}

export function settleOnGround(point: Vec, context: StepContext, radius: number): Vec {
  let settled = point
  for (let pass = 0; pass < 3; pass += 1) {
    context.world.props.forEach((prop) => {
      if (prop.kind === 'pond') {
        settled = pushOutOfPond(settled, prop, radius, { x: 0, y: 1 })
        return
      }
      const center = prop.tunnelExit ? closestOnSegment(settled, prop.position, prop.tunnelExit) : prop.position
      if (!prop.solid && !prop.tunnelExit) return
      const reach = prop.radius + radius
      const offset = subtract(settled, center)
      const gap = length(offset)
      if (gap >= reach) return
      const normal = gap > 1e-3 ? scale(offset, 1 / gap) : { x: 0, y: 1 }
      settled = add(center, scale(normal, reach + 1))
    })
    settled = clampToBounds(settled, context.bounds)
  }
  return settled
}

export function pointBeside(prop: PropState, cat: CatState, context: StepContext, side: number): Vec {
  const reach = prop.solid ? prop.radius + catRadius(cat) + 6 : prop.radius * 0.3
  return clampToBounds({ x: prop.position.x + side * reach, y: prop.position.y + 4 }, context.bounds)
}
