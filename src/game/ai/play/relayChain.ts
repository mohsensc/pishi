import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { boundsCenter, clampToBounds } from '../../bounds'
import { aimToss } from '../../physics'
import { add, clamp, distance, scale } from '../../vector'
import type { CatState, Vec } from '../../types'
import { releaseBall } from '../helpers/ball'
import { chooseEscape } from '../helpers/escape'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { faceToward, lockPose, setEmote } from '../helpers/pose'
import { findBall, mouthPoint, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { threatened } from '../helpers/threat'
import { beginChase } from '../helpers/transitions'
import { holdBallQuietly } from './shared/ballPlay'
import { catAtRank, hasPartnerNearby, isFollower, socialSetup, type SocialFrame } from './shared/partners'

const relayId = 'relayChain'

function relaySpot(frame: SocialFrame, rank: number, context: StepContext): Vec {
  const anchor = frame.leaderMind.scratchPoints.anchor
  const axis = frame.leaderMind.scratchPoints.axis
  return clampToBounds(add(anchor, scale(axis, sizeScaled(context, 140) * rank)), context.bounds)
}

function prepareAxis(cat: CatState, mind: CatMind, context: StepContext): void {
  if (mind.scratchPoints.axis) return
  const center = boundsCenter(context.bounds)
  mind.scratchPoints.anchor = { x: cat.position.x, y: cat.position.y }
  mind.scratchPoints.axis = { x: cat.position.x < center.x ? 1 : -1, y: context.memory.random.range(-0.25, 0.25) }
  mind.scratchIds.ball = cat.heldBallId ?? ''
  mind.scratchNumbers.stage = 0
  mind.scratchNumbers.tossedAt = 0
}

function tossToNext(cat: CatState, mind: CatMind, context: StepContext, frame: SocialFrame, receiver: CatState): void {
  const ball = findBall(context, cat.heldBallId)
  if (!ball) return
  const mouth = mouthPoint(cat)
  const startHeight = cat.height + 14 * cat.coat.scale
  const flightTime = clamp(distance(mouth, receiver.position) / (420 * context.memory.speedScale), 0.45, 0.9)
  const toss = aimToss(mouth, startHeight, receiver.position, flightTime)
  ball.position = mouth
  ball.height = startHeight
  const released = releaseBall(cat, mind, context, toss.velocity, toss.verticalSpeed, 1.2)
  if (released) released.height = startHeight
  lockPose(mind, 'bat', 0.3)
  frame.leaderMind.scratchNumbers.stage = frame.rank + 1
  frame.leaderMind.scratchNumbers.tossedAt = context.world.time
}

export const relayChainBehavior: Behavior = {
  id: relayId,
  intent: 'passBall',
  interruptible: true,
  withBall: true,
  minDuration: 8,
  maxDuration: 12,
  weight: (cat, _mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, 480), 2) ? 0.5 : 0),
  start(_cat, mind) {
    mind.behaviorUrgency = 3
    mind.movePose = 'walk'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    if (!isFollower(mind)) prepareAxis(cat, mind, context)
    const frame = socialSetup(cat, mind, context, relayId, sizeScaled(context, 480), 2)
    if (!frame) return finishBehavior(cat, mind, context)
    const ball = findBall(context, frame.leaderMind.scratchIds.ball ?? null)
    const total = frame.partners.length + 1
    if (!ball || ball.status === 'popped' || ball.status === 'stashed' || (ball.status === 'held' && !frame.partners.concat(frame.leader).some((member) => member.id === ball.holderId))) return finishBehavior(cat, mind, context)
    const stage = frame.leaderMind.scratchNumbers.stage
    if (cat.heldBallId === ball.id) {
      if (threatened(cat, mind, context)) {
        chooseEscape(cat, mind, context, true)
        return zeroVector
      }
      if (frame.rank >= total - 1) {
        setEmote(cat, 'proud')
        return finishBehavior(cat, mind, context)
      }
      const receiver = catAtRank(frame, frame.rank + 1)
      if (!receiver) return finishBehavior(cat, mind, context)
      faceToward(cat, mind, receiver.position, 0.4)
      const ready = distance(receiver.position, relaySpot(frame, frame.rank + 1, context)) < sizeScaled(context, 26)
      if (ready && mind.phaseTimer > 0.6) tossToNext(cat, mind, context, frame, receiver)
      return brake(cat)
    }
    if (ball.status === 'loose' && stage === frame.rank) {
      mind.scratchPoints.gaze = { x: ball.position.x, y: ball.position.y - ball.height }
      if (distance(ball.position, cat.position) < 32 * cat.coat.scale && ball.height < 60) {
        holdBallQuietly(cat, mind, ball)
        hopInPlace(cat, mind, context, 14, 0.26, 'jump')
        setEmote(cat, 'playful')
        mind.phaseTimer = 0
        return zeroVector
      }
      if (context.world.time - frame.leaderMind.scratchNumbers.tossedAt > 1.6) {
        beginChase(cat, mind, context, ball, 1.1)
        return zeroVector
      }
      if (distance(ball.position, cat.position) < sizeScaled(context, 90)) return arrive(cat, ball.position, paceSpeed(cat, mind, context, 0.8), 10)
    }
    if (frame.isLeader && stage > 0 && ball.status === 'held' && ball.holderId === catAtRank(frame, total - 1)?.id) return finishBehavior(cat, mind, context)
    const spot = relaySpot(frame, frame.rank, context)
    if (distance(cat.position, spot) < sizeScaled(context, 8)) {
      mind.idlePose = 'crouch'
      mind.scratchPoints.gaze = { x: ball.position.x, y: ball.position.y - ball.height }
      return brake(cat)
    }
    return arrive(cat, spot, paceSpeed(cat, mind, context, 0.6), 24)
  },
}
