import { clampToBounds, lawnBounds } from './bounds'
import { BALL_ARRIVAL_GAP, BALL_COUNT, BALL_RADIUS, BALL_RESPAWN_MAX, BALL_RESPAWN_MIN, POP_LIFETIME } from './constants'
import { spawnEffect } from './effects'
import { hidingHeightOf } from './layout'
import { isUnderCanopy } from './layoutOcclusion'
import type { StepContext } from './memory'
import { isTennisBall } from './pointer'
import { depthScale } from './projection'
import { createBall, isClearGround, isOpenSpot } from './spawning'
import type { BallState, PropState, Vec, World } from './types'
import { registerSupplyBall } from './economy/minting'

const pendingArrivals = new WeakMap<World, number[]>()
const treeDropChance = 0.5
const plentifulTrees = 8
const treePicks = 4
const landingTries = 5
const poppedLinger = POP_LIFETIME + 0.4

function arrivalsOf(context: StepContext): number[] {
  let arrivals = pendingArrivals.get(context.world)
  if (!arrivals) {
    arrivals = []
    pendingArrivals.set(context.world, arrivals)
  }
  return arrivals
}

function activeTennisCount(balls: BallState[]): number {
  return balls.reduce((count, ball) => (isTennisBall(ball) && ball.status !== 'popped' ? count + 1 : count), 0)
}

function clearPoppedBalls(context: StepContext): void {
  const { world } = context
  if (!world.balls.some((ball) => ball.status === 'popped' && ball.poppedAt !== null && world.time - ball.poppedAt > poppedLinger)) return
  world.balls = world.balls.filter((ball) => ball.status !== 'popped' || ball.poppedAt === null || world.time - ball.poppedAt <= poppedLinger)
}

function scheduleArrivals(context: StepContext, arrivals: number[]): void {
  const { world, memory } = context
  while (activeTennisCount(world.balls) + arrivals.length < BALL_COUNT) {
    const latest = arrivals.length > 0 ? arrivals[arrivals.length - 1] : Number.NEGATIVE_INFINITY
    const scarcity = 0.35 + 0.65 * (activeTennisCount(world.balls) / BALL_COUNT)
    arrivals.push(Math.max(world.time + memory.random.range(BALL_RESPAWN_MIN, BALL_RESPAWN_MAX) * scarcity, latest + BALL_ARRIVAL_GAP))
  }
}

function treeLanding(context: StepContext, tree: PropState): Vec | null {
  const { world, memory } = context
  const spread = tree.radius * 1.4 * depthScale(tree.position.y, world.height)
  const bounds = lawnBounds(world.width, world.height, 10)
  for (let attempt = 0; attempt < landingTries; attempt += 1) {
    const reach = tree.radius * memory.random.range(1.05, 1.5 + attempt * 0.35)
    const landing = clampToBounds({ x: tree.position.x + memory.random.range(-spread, spread), y: tree.position.y + reach }, bounds)
    if (isClearGround(world, landing, BALL_RADIUS + 4)) return landing
  }
  return null
}

function dropFromTree(context: StepContext, tree: PropState, position: Vec): BallState {
  const { world, memory } = context
  const canopy = hidingHeightOf(tree, world.height)
  const ball = createBall(memory, 'tennis', position, canopy * 0.8, 'tree')
  ball.velocity = { x: memory.random.range(-50, 50), y: memory.random.range(10, 50) }
  tree.agitation = Math.max(tree.agitation, 0.7)
  tree.pokedAt = world.time
  spawnEffect(world, 'leaves', position, canopy * 0.85, tree.id, 0.7)
  return ball
}

function edgeEntryIsClear(world: World, position: Vec): boolean {
  return isOpenSpot(world.props, position, BALL_RADIUS + 10) && !isUnderCanopy(world.props, position, world.height)
}

function rollInFromEdge(context: StepContext): BallState {
  const { world, memory } = context
  const bounds = lawnBounds(world.width, world.height, 4)
  const side = memory.random.sign()
  let position: Vec = { x: side < 0 ? bounds.left : bounds.right, y: memory.random.range(bounds.top, bounds.bottom) }
  for (let attempt = 0; attempt < 16 && !edgeEntryIsClear(world, position); attempt += 1) {
    position = { x: position.x, y: memory.random.range(bounds.top, bounds.bottom) }
  }
  const ball = createBall(memory, 'tennis', position, memory.random.range(20, 60), 'edge')
  const speed = memory.random.range(240, 340) * memory.speedScale
  ball.velocity = { x: -side * speed, y: memory.random.range(-40, 40) }
  ball.verticalSpeed = memory.random.range(160, 260)
  return ball
}

function treeDrop(context: StepContext): BallState | null {
  const { world, memory } = context
  const trees = world.props.filter((prop) => prop.kind === 'tree')
  if (trees.length === 0 || !memory.random.chance(treeDropChance * Math.min(1, trees.length / plentifulTrees))) return null
  for (let pick = 0; pick < treePicks; pick += 1) {
    const tree = memory.random.pick(trees)
    const landing = treeLanding(context, tree)
    if (landing) return dropFromTree(context, tree, landing)
  }
  return null
}

function deliverBall(context: StepContext): void {
  const { world } = context
  const ball = treeDrop(context) ?? rollInFromEdge(context)
  registerSupplyBall(world, ball.id)
  world.balls.push(ball)
}

export function stepBallSupply(context: StepContext): void {
  const arrivals = arrivalsOf(context)
  clearPoppedBalls(context)
  scheduleArrivals(context, arrivals)
  while (arrivals.length > 0 && arrivals[0] <= context.world.time) {
    arrivals.shift()
    if (activeTennisCount(context.world.balls) < BALL_COUNT) deliverBall(context)
  }
}
