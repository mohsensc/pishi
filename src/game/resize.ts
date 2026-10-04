import { beginBehavior } from './ai/helpers/transitions'
import { catSizeScale, clampToBounds, createLawnMapper, lawnBounds, viewportScale } from './bounds'
import { breedProfiles } from './catalog'
import { BALL_RADIUS } from './constants'
import { refitProps, rescaleProps } from './layout'
import { createMind, type EngineMemory } from './memory'
import type { Vec, World } from './types'
import { idleContext, memoryFor } from './engine'
import { isOpenSpot, openSpot } from './spawning'
import { depthScale } from './projection'

function releaseEveryone(world: World, memory: EngineMemory, mapPoint: (point: Vec) => Vec): void {
  const bounds = lawnBounds(world.width, world.height)
  const placed: Vec[] = []
  const context = idleContext(world, memory)
  world.cats.forEach((cat) => {
    const mind = memory.minds.get(cat.id)
    const freshMind = createMind(mind ? mind.personality : { ...breedProfiles[cat.coat.breed], breed: cat.coat.breed, seed: memory.random.next() })
    freshMind.idlePose = mind ? mind.idlePose : 'sit'
    memory.minds.set(cat.id, freshMind)
    const mapped = clampToBounds(mapPoint(cat.position), bounds)
    const position = isOpenSpot(world.props, mapped, 20) ? mapped : openSpot(world, memory, 20, placed, 50 * memory.sizeScale)
    placed.push(position)
    cat.position = position
    cat.velocity = { x: 0, y: 0 }
    cat.height = 0
    cat.verticalSpeed = 0
    cat.hidden = false
    cat.propId = null
    cat.pose = 'sit'
    cat.behavior = ''
    beginBehavior(cat, freshMind, context, cat.heldBallId ? 'carryBall' : 'sitIdle', { duration: 0.3 })
    freshMind.decisionTimer = memory.random.range(0.2, 1.2)
    if (cat.heldBallId) freshMind.ballId = cat.heldBallId
  })
  memory.stashes.clear()
  world.balls.forEach((ball) => {
    if (ball.status === 'held') return
    if (ball.status === 'stashed') {
      ball.status = 'loose'
      ball.stashPropId = null
      ball.position = openSpot(world, memory, BALL_RADIUS + 6)
      ball.height = 120
      ball.velocity = { x: 0, y: 0 }
      ball.verticalSpeed = 0
      return
    }
    const mapped = clampToBounds(mapPoint(ball.position), lawnBounds(world.width, world.height, -12))
    ball.position = ball.status === 'loose' && !isOpenSpot(world.props, mapped, BALL_RADIUS) ? openSpot(world, memory, BALL_RADIUS + 6) : mapped
  })
  world.butterflies.forEach((butterfly) => {
    butterfly.position = clampToBounds(mapPoint(butterfly.position), bounds)
  })
  world.pops = world.pops.map((pop) => ({ ...pop, position: mapPoint(pop.position) }))
  world.effects = []
}

export function resizeWorld(world: World, width: number, height: number): void {
  const nextWidth = Math.max(1, width)
  const nextHeight = Math.max(1, height)
  if (nextWidth === world.width && nextHeight === world.height) return
  const memory = memoryFor(world)
  const newBounds = lawnBounds(nextWidth, nextHeight)
  const mapPoint = createLawnMapper(world.width, world.height, nextWidth, nextHeight)
  const scaleRatio = viewportScale(nextWidth, nextHeight) / viewportScale(world.width, world.height)
  const aspectRatioChange = (nextWidth / nextHeight) / (world.width / world.height)
  const needsFreshLayout = scaleRatio < 0.88 || scaleRatio > 1.14 || aspectRatioChange < 0.8 || aspectRatioChange > 1.25
  const catScaleRatio = catSizeScale(nextWidth, nextHeight) / catSizeScale(world.width, world.height)
  if (needsFreshLayout) {
    world.props = refitProps(world.props, world.width, world.height, nextWidth, nextHeight, memory.random)
  } else {
    rescaleProps(world.props, world.width, world.height, nextWidth, nextHeight)
  }
  world.width = nextWidth
  world.height = nextHeight
  world.landscape.felled = world.landscape.felled.map((felled) => {
    const position = mapPoint(felled.position)
    return { ...felled, position, radius: felled.radius * scaleRatio, scale: depthScale(position.y, nextHeight) }
  })
  memory.sizeScale = viewportScale(nextWidth, nextHeight)
  memory.speedScale = Math.pow(memory.sizeScale, 0.7)
  if (Math.abs(catScaleRatio - 1) > 0.01) {
    world.cats.forEach((cat) => {
      cat.coat = { ...cat.coat, scale: cat.coat.scale * catScaleRatio }
    })
  }
  if (needsFreshLayout) {
    releaseEveryone(world, memory, mapPoint)
    return
  }
  world.cats.forEach((cat) => {
    const mind = memory.minds.get(cat.id)
    cat.position = clampToBounds(mapPoint(cat.position), newBounds)
    if (!mind) return
    if (mind.leap) {
      mind.leap.from = mapPoint(mind.leap.from)
      mind.leap.to = clampToBounds(mapPoint(mind.leap.to), newBounds)
    }
    if (mind.perch) mind.perch = { ...mind.perch, spot: mapPoint(mind.perch.spot) }
    if (mind.climbPlan) mind.climbPlan = { ...mind.climbPlan, spot: mapPoint(mind.climbPlan.spot) }
    if (mind.tunnelFrom) mind.tunnelFrom = mapPoint(mind.tunnelFrom)
    if (mind.tunnelTo) mind.tunnelTo = mapPoint(mind.tunnelTo)
    if (mind.target) mind.target = clampToBounds(mapPoint(mind.target), newBounds)
  })
  world.balls.forEach((ball) => {
    ball.position = clampToBounds(mapPoint(ball.position), lawnBounds(nextWidth, nextHeight, -12))
  })
  world.butterflies.forEach((butterfly) => {
    butterfly.position = clampToBounds(mapPoint(butterfly.position), newBounds)
  })
  world.pops = world.pops.map((pop) => ({ ...pop, position: mapPoint(pop.position) }))
}
