import { beginRetrieve, isAvailableForRetrieve } from './ai/coordination'
import { ejectStashedBall } from './ai/helpers/ball'
import { hiddenAllowance, mouthPoint } from './ai/helpers/queries'
import { startleCat } from './ai/helpers/reactions'
import { resumeAfterAction } from './ai/helpers/transitions'
import { boundsCenter, clampToBounds } from './bounds'
import { HELD_BALL_LIFT, POP_STARTLE_RADIUS, STASH_FORCE_EJECT } from './constants'
import { type StepContext } from './memory'
import { launchBall } from './physics'
import { isPoppable, popReach } from './pointer'
import { toScreen } from './projection'
import { distance, isFiniteVec } from './vector'
import type { BallState, World } from './types'
import { holdsPop } from './dragging'
import { classifyCatch } from './care/catchTracking'
import { grantCatchReward } from './care/inventory'
import { isSupplyBall, mintCatchTokens } from './economy/minting'
import { exciteCats } from './liveliness'

export function popBall(context: StepContext, ball: BallState): void {
  const { world, memory } = context
  ball.status = 'popped'
  ball.poppedAt = world.time
  ball.holderId = null
  ball.velocity = { x: 0, y: 0 }
  ball.verticalSpeed = 0
  memory.popSerial += 1
  world.pops.push({ id: `pop-${memory.popSerial}`, position: { x: ball.position.x, y: ball.position.y }, time: world.time })
  world.poppedCount += 1
  const catchKind = classifyCatch(world, ball)
  if (isSupplyBall(world, ball.id)) {
    const minted = mintCatchTokens(context, catchKind, ball.id)
    grantCatchReward(context, catchKind, minted.minted)
  }
  exciteCats(world)
  world.cats.forEach((cat) => {
    if (distance(cat.position, ball.position) < POP_STARTLE_RADIUS * memory.sizeScale) startleCat(cat, context, ball.position)
  })
}

export function checkPops(context: StepContext): void {
  const { world, pointer } = context
  if (!pointer.active || pointer.tool !== 'hand') return
  world.balls.forEach((ball) => {
    if (!isPoppable(ball)) return
    if (distance(toScreen(ball.position, ball.height), pointer.position) > popReach(ball, world.height, pointer.pressed)) return
    if (holdsPop(context, ball)) return
    popBall(context, ball)
  })
}

export function maintainStashes(context: StepContext): void {
  const { world, memory } = context
  memory.stashes.forEach((record, ballId) => {
    const ball = world.balls.find((candidate) => candidate.id === ballId)
    if (!ball || ball.status !== 'stashed') {
      memory.stashes.delete(ballId)
      return
    }
    const age = world.time - record.since
    const box = world.props.find((prop) => prop.id === record.propId)
    if (age > STASH_FORCE_EJECT || !box) {
      memory.stashes.delete(ballId)
      if (record.retrieverId) {
        const retriever = world.cats.find((cat) => cat.id === record.retrieverId)
        if (retriever && retriever.intent === 'retrieveBall' && !retriever.hidden) retriever.intentTimer = 0
      }
      ejectStashedBall(ball, box, context)
      return
    }
    if (world.time < record.retrieveAt) return
    const current = record.retrieverId ? world.cats.find((cat) => cat.id === record.retrieverId) : undefined
    if (current && current.intent === 'retrieveBall') return
    record.retrieverId = null
    const stasher = world.cats.find((cat) => cat.id === record.stasherId)
    const candidates = world.cats.filter((cat) => isAvailableForRetrieve(cat, context))
    const chosen =
      stasher && candidates.includes(stasher)
        ? stasher
        : candidates.sort((first, second) => distance(first.position, ball.position) - distance(second.position, ball.position))[0]
    if (!chosen) return
    record.retrieverId = chosen.id
    beginRetrieve(chosen, context, ballId)
  })
}

export function syncHeldBalls(world: World): void {
  world.balls.forEach((ball) => {
    if (ball.status !== 'held') return
    const holder = world.cats.find((cat) => cat.id === ball.holderId && cat.heldBallId === ball.id)
    if (!holder) {
      launchBall(ball, { x: 0, y: 0 }, 0)
      return
    }
    ball.position = mouthPoint(holder)
    ball.height = holder.height + HELD_BALL_LIFT * holder.coat.scale
    ball.velocity = { x: holder.velocity.x, y: holder.velocity.y }
    ball.verticalSpeed = 0
    ball.spin += holder.velocity.x * 0.002
  })
  world.cats.forEach((cat) => {
    if (!cat.heldBallId) return
    const ball = world.balls.find((candidate) => candidate.id === cat.heldBallId)
    if (!ball || ball.status !== 'held' || ball.holderId !== cat.id) cat.heldBallId = null
  })
}

export function enforceVisibility(context: StepContext): void {
  const { world } = context
  const allowed = hiddenAllowance(world.cats)
  const hidden = world.cats.filter((cat) => cat.hidden)
  if (hidden.length <= allowed) return
  hidden.slice(allowed).forEach((cat) => {
    const prop = world.props.find((candidate) => candidate.id === cat.propId)
    cat.hidden = false
    cat.propId = null
    cat.height = 0
    if (prop) cat.position = clampToBounds({ x: prop.position.x, y: prop.position.y + prop.radius + 16 }, context.bounds)
    const mind = context.memory.minds.get(cat.id)
    if (mind) resumeAfterAction(cat, mind, context)
  })
}

export function syncOccupants(world: World): void {
  world.props = world.props.map((prop) => {
    const occupants = world.cats.filter((cat) => cat.propId === prop.id).map((cat) => cat.id)
    const same = occupants.length === prop.occupantIds.length && occupants.every((id, index) => prop.occupantIds[index] === id)
    return same ? prop : { ...prop, occupantIds: occupants }
  })
}

export function sanitize(context: StepContext): void {
  const { world } = context
  const center = boundsCenter(context.bounds)
  world.cats.forEach((cat) => {
    if (!isFiniteVec(cat.position) || !Number.isFinite(cat.height)) {
      cat.position = { ...center }
      cat.height = 0
    }
    if (!isFiniteVec(cat.velocity)) cat.velocity = { x: 0, y: 0 }
    if (!cat.hidden) cat.position = clampToBounds(cat.position, context.bounds)
  })
  world.balls.forEach((ball) => {
    if (!isFiniteVec(ball.position) || !Number.isFinite(ball.height)) {
      ball.position = { ...center }
      ball.height = 0
    }
    if (!isFiniteVec(ball.velocity) || !Number.isFinite(ball.verticalSpeed)) {
      ball.velocity = { x: 0, y: 0 }
      ball.verticalSpeed = 0
    }
  })
}
