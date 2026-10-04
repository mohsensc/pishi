import type { Behavior } from '../behavior'
import { add, distance, length, scale } from '../../vector'
import { chasersOf } from '../helpers/ball'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { findBall, randomTimer, zeroVector } from '../helpers/queries'
import { brake, orbit } from '../helpers/steering'
import { beginChase } from '../helpers/transitions'
import { nearestLooseBall } from './shared/ballPlay'

const circlingUrgency = 3

export const circleBallBehavior: Behavior = {
  id: 'circleBall',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight: (cat, mind, context) => {
    const ball = nearestLooseBall(cat, context, sizeScaled(context, 240))
    return ball && ball.height < 4 && length(ball.velocity) < 60 && chasersOf(context, ball.id, cat.id) === 0 ? 0.3 + mind.personality.curiosity * 0.3 : 0
  },
  urgency(cat, mind, context) {
    if (cat.heldBallId || cat.hidden || !context.memory.random.chance(0.03 + mind.personality.curiosity * 0.04)) return 0
    return circleBallBehavior.weight(cat, mind, context) > 0 ? circlingUrgency + 0.2 : 0
  },
  start(cat, mind, context) {
    mind.ballId = nearestLooseBall(cat, context, sizeScaled(context, 240))?.id ?? null
    mind.behaviorUrgency = circlingUrgency
    mind.scratchNumbers.direction = context.memory.random.sign()
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
    enterPhase(mind, 'circle', randomTimer(context, 2, 3.4))
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const ball = findBall(context, mind.ballId)
    if (!ball || ball.status !== 'loose') return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = ball.position
    if (length(ball.velocity) > 150) {
      beginChase(cat, mind, context, ball, 1.1)
      return zeroVector
    }
    if (mind.phase === 'crouch') {
      if (!phaseDone(mind)) return brake(cat, 6)
      beginChase(cat, mind, context, ball, 1.2)
      mind.regrabUntil = 0
      startLeap(cat, mind, context, add(ball.position, scale(ball.velocity, 0.2)), 0, 22 * mind.personality.jumpPower, 0.32, 'pounce', 'grab')
      return zeroVector
    }
    const radius = sizeScaled(context, 52)
    if (phaseDone(mind) && Math.abs(distance(cat.position, ball.position) - radius) < sizeScaled(context, 20)) {
      setEmote(cat, 'playful')
      enterPhase(mind, 'crouch', randomTimer(context, 0.3, 0.6))
      return zeroVector
    }
    const direction: 1 | -1 = mind.scratchNumbers.direction > 0 ? 1 : -1
    return orbit(cat, ball.position, radius, paceSpeed(cat, mind, context, 0.3), direction)
  },
}
