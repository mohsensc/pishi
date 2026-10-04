import { assignReceiver } from './ai/coordination'
import { beginBehavior } from './ai/helpers/transitions'
import { boundsCenter, clampToBounds, lawnBounds, type LawnBounds } from './bounds'
import { ejectStashesIn } from './ai/helpers/ball'
import { popOutAll } from './ai/helpers/hiding'
import { BALL_COUNT, BALL_RADIUS, MAX_EXTRA_TOYS } from './constants'
import { freeSpotFor } from './dragging/freeSpot'
import { spawnEffect } from './effects'
import { interactionContext } from './engine'
import { createPropState, recipeFor } from './layout'
import { type EngineMemory, type StepContext } from './memory'
import { isInPond } from './physics'
import { isUnderCanopy } from './layoutOcclusion'
import { distance, lerpVec } from './vector'
import type { BallKind, BallState, PropKind, PropState, Vec, World } from './types'
import { registerSupplyBall } from './economy/minting'
import { MAX_PURCHASED_PROPS } from './economy/economyConstants'
import { purchasedPropCount } from './economy/pricing'

export function isOpenSpot(props: PropState[], point: Vec, clearance: number): boolean {
  if (isInPond(props, point, 1.2)) return false
  return !props.some((prop) => {
    if (prop.tunnelExit) {
      const midpoint = lerpVec(prop.position, prop.tunnelExit, 0.5)
      return distance(midpoint, point) < distance(prop.position, prop.tunnelExit) / 2 + prop.radius + clearance
    }
    return prop.solid && distance(prop.position, point) < prop.radius + clearance
  })
}

export function isClearGround(world: World, point: Vec, clearance: number): boolean {
  return isOpenSpot(world.props, point, clearance) && !isUnderCanopy(world.props, point, world.height)
}

export function openSpot(world: World, memory: EngineMemory, clearance: number, avoid: Vec[] = [], spacing = 0): Vec {
  const bounds = lawnBounds(world.width, world.height, 6)
  let fallback = boundsCenter(bounds)
  let fallbackShaded = true
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const point = { x: memory.random.range(bounds.left, bounds.right), y: memory.random.range(bounds.top, bounds.bottom) }
    if (!isOpenSpot(world.props, point, clearance)) continue
    const shaded = isUnderCanopy(world.props, point, world.height)
    if (fallbackShaded || !shaded) {
      fallback = point
      fallbackShaded = shaded
    }
    if (shaded && attempt < 70) continue
    if (avoid.every((other) => distance(other, point) > spacing * (attempt < 50 ? 1 : 0.5))) return point
  }
  return fallback
}

export function createBall(memory: EngineMemory, kind: BallKind, position: Vec, height: number, label: string): BallState {
  memory.ballSerial += 1
  return {
    id: `${kind === 'tennis' ? 'ball' : 'mouse'}-${label}-${memory.ballSerial}`,
    kind,
    position,
    velocity: { x: memory.random.range(-40, 40), y: memory.random.range(-30, 30) },
    height,
    verticalSpeed: 0,
    spin: memory.random.range(0, Math.PI * 2),
    status: 'loose',
    holderId: null,
    stashPropId: null,
    poppedAt: null,
    thrownAt: null,
  }
}

export function spawnBalls(world: World, memory: EngineMemory, count: number, dropped: boolean): BallState[] {
  const spots: Vec[] = []
  return Array.from({ length: count }, (_, index) => {
    const position = openSpot(world, memory, BALL_RADIUS + 6, spots, 120 * memory.sizeScale)
    spots.push(position)
    const ball = createBall(memory, 'tennis', position, dropped ? memory.random.range(140, 280) : 0, String(index))
    registerSupplyBall(world, ball.id)
    return ball
  })
}

function extraToyCount(world: World): number {
  const mice = world.balls.filter((ball) => ball.kind === 'mouse').length
  const tennis = world.balls.filter((ball) => ball.kind === 'tennis' && ball.status !== 'popped').length
  return mice + Math.max(0, tennis - BALL_COUNT)
}

export function spawnLooseToy(world: World, kind: BallKind, point: Vec): string | null {
  if (isToyCapReached(world)) return null
  const context = interactionContext(world)
  const ball = createBall(context.memory, kind, clampToBounds(point, context.bounds), 40, 'spawned')
  world.balls.push(ball)
  return ball.id
}

export function removeLooseToy(world: World, ballId: string): boolean {
  const ball = world.balls.find((candidate) => candidate.id === ballId)
  if (!ball || ball.status === 'held' || ball.status === 'stashed') return false
  if (ball.kind === 'tennis' && world.balls.filter((candidate) => candidate.kind === 'tennis').length <= BALL_COUNT) return false
  world.balls = world.balls.filter((candidate) => candidate.id !== ballId)
  return true
}

function nearestOpenSpot(world: World, point: Vec, clearance: number, bounds: LawnBounds): Vec {
  const start = clampToBounds(point, bounds)
  if (isOpenSpot(world.props, start, clearance)) return start
  for (let ring = 1; ring <= 20; ring += 1) {
    const reach = ring * 12
    for (let step = 0; step < 12; step += 1) {
      const angle = (step / 12) * Math.PI * 2 + ring * 0.4
      const candidate = clampToBounds({ x: start.x + Math.cos(angle) * reach, y: start.y + Math.sin(angle) * reach * 0.7 }, bounds)
      if (isOpenSpot(world.props, candidate, clearance)) return candidate
    }
  }
  return start
}

export function isPropCapReached(world: World): boolean {
  return purchasedPropCount(world) >= MAX_PURCHASED_PROPS
}

export function isToyCapReached(world: World): boolean {
  return extraToyCount(world) >= MAX_EXTRA_TOYS
}

export function spawnProp(world: World, kind: PropKind, point: Vec): string | null {
  if ((kind !== 'tree' && isPropCapReached(world)) || kind === 'feedingStation') return null
  const context = interactionContext(world)
  const recipe = recipeFor(kind, context.memory.sizeScale, context.memory.random)
  const requested = nearestOpenSpot(world, point, recipe.radius + 8, context.bounds)
  const tunnelLength = kind === 'tunnel' ? 150 * context.memory.sizeScale : 0
  context.memory.popSerial += 1
  const prop = createPropState(`prop-${kind}-spawned-${context.memory.popSerial}`, recipe, requested, kind === 'tunnel' ? { x: requested.x + tunnelLength, y: requested.y } : null, context.memory.random.integer(0, 2))
  const position = freeSpotFor(prop, requested, world.props, context.bounds, context.memory.sizeScale)
  prop.position = position
  if (prop.tunnelExit) prop.tunnelExit = { x: position.x + tunnelLength, y: position.y }
  prop.spawnedAt = world.time
  prop.droppedAt = world.time
  world.props = [...world.props, prop]
  spawnEffect(world, 'dust', position, 0, prop.id, 0.8)
  return prop.id
}

export function removeProp(world: World, propId: string): boolean {
  const prop = world.props.find((candidate) => candidate.id === propId)
  if (!prop || prop.kind === 'feedingStation') return false
  const context = interactionContext(world)
  ejectStashesIn(prop, context)
  popOutAll(prop, context)
  world.cats.forEach((cat) => {
    const mind = context.memory.minds.get(cat.id)
    if (cat.propId === propId) {
      cat.propId = null
      cat.hidden = false
    }
    if (!mind) return
    if (mind.propTargetId === propId) mind.propTargetId = null
    if (mind.perch?.propId === propId) mind.perch = null
    if (mind.climbPlan?.propId === propId) mind.climbPlan = null
  })
  world.props = world.props.filter((candidate) => candidate.id !== propId)
  spawnEffect(world, 'dust', prop.position, 0, null, 0.6)
  return true
}

export function deliverBallsToCats(context: StepContext): void {
  const { world, memory } = context
  const candidates = world.cats.filter((cat) => !cat.hidden && !cat.heldBallId && cat.height < 1 && !memory.minds.get(cat.id)?.leap)
  const shuffled = candidates
    .map((cat) => ({ cat, order: memory.random.next() }))
    .sort((first, second) => first.order - second.order)
    .map((entry) => entry.cat)
  world.balls.filter((ball) => ball.kind === 'tennis').forEach((ball, index) => {
    const cat = shuffled[index]
    if (!cat || ball.status !== 'loose') return
    const offset = { x: cat.facing * memory.random.range(20, 60), y: memory.random.range(-10, 20) }
    ball.position = clampToBounds({ x: cat.position.x + offset.x, y: cat.position.y + offset.y }, lawnBounds(world.width, world.height, 4))
    ball.velocity = { x: 0, y: 0 }
    ball.height = memory.random.range(140, 200)
    ball.verticalSpeed = 0
    assignReceiver(cat, context, ball)
  })
}

export function startInitialBehaviors(context: StepContext): void {
  const { world, memory } = context
  world.cats.forEach((cat) => {
    const mind = memory.minds.get(cat.id)
    if (!mind) return
    const napper = mind.personality.laziness > 0.6 && memory.random.chance(0.6)
    if (napper) beginBehavior(cat, mind, context, 'napping', { duration: memory.random.range(4, 9) })
    else beginBehavior(cat, mind, context, 'sitIdle', { duration: memory.random.range(0.5, 3) })
    cat.pose = mind.idlePose
  })
}
