import type { Behavior } from '../behavior'
import { launchBall } from '../../physics'
import { distance } from '../../vector'
import { blockRegrab, releaseBall } from '../helpers/ball'
import { chooseEscape } from '../helpers/escape'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { findBall, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { threatened } from '../helpers/threat'
import { beginChase } from '../helpers/transitions'
import { holdBallQuietly } from './shared/ballPlay'

export const keepyUpBehavior: Behavior = {
  id: 'keepyUp',
  intent: 'play',
  interruptible: true,
  withBall: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (_cat, mind) => 0.1 + mind.personality.jumpPower * 0.1,
  start(cat, mind, context) {
    mind.behaviorUrgency = 3
    mind.scratchNumbers.tosses = context.memory.random.integer(3, 5)
    const released = releaseBall(cat, mind, context, { x: cat.facing * 12, y: 0 }, 430, 0)
    mind.ballId = released?.id ?? null
    mind.idlePose = 'reach'
    mind.movePose = 'walk'
    lockPose(mind, 'bat', 0.18)
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (cat.heldBallId && threatened(cat, mind, context)) {
      chooseEscape(cat, mind, context, true)
      return zeroVector
    }
    const ball = findBall(context, mind.ballId)
    if (!ball || ball.status !== 'loose') return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = { x: ball.position.x, y: ball.position.y - ball.height }
    const gap = distance(cat.position, ball.position)
    if (ball.height < 3 && ball.verticalSpeed <= 0 && mind.phaseTimer > 0.4) {
      setEmote(cat, 'annoyed')
      beginChase(cat, mind, context, ball, 1)
      mind.regrabUntil = 0
      return zeroVector
    }
    const catchHeight = 22 + 10 * mind.personality.jumpPower
    if (gap < sizeScaled(context, 26) && ball.verticalSpeed < 0 && ball.height < catchHeight + 16 && ball.height > 8) {
      mind.attempts += 1
      if (mind.attempts >= mind.scratchNumbers.tosses && context.memory.random.chance(0.4)) {
        blockRegrab(mind, ball, context, 5)
        setEmote(cat, 'sleepy')
        return finishBehavior(cat, mind, context)
      }
      if (mind.attempts >= mind.scratchNumbers.tosses) {
        holdBallQuietly(cat, mind, ball)
        hopInPlace(cat, mind, context, 14, 0.28, 'jump')
        setEmote(cat, 'proud')
        return finishBehavior(cat, mind, context)
      }
      const random = context.memory.random
      launchBall(ball, { x: random.range(-30, 30), y: random.range(-18, 18) }, random.range(380, 460))
      if (mind.attempts % 2 === 0) hopInPlace(cat, mind, context, 12, 0.24, 'reach')
      else lockPose(mind, 'bat', 0.2)
      mind.phaseTimer = 0
      return zeroVector
    }
    if (gap < sizeScaled(context, 6)) return brake(cat)
    return arrive(cat, ball.position, paceSpeed(cat, mind, context, 0.7), 20)
  },
}
