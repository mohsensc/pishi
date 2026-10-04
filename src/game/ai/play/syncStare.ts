import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { faceToward, setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const stareId = 'syncStare'

export const syncStareBehavior: Behavior = {
  id: stareId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 4,
  maxDuration: 6,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.08 + mind.personality.curiosity * 0.08 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, stareId, sizeScaled(context, partnerReach), 2)
    if (!frame) return finishBehavior(cat, mind, context)
    if (frame.isLeader && !mind.scratchPoints.focus) mind.scratchPoints.focus = randomOpenPoint(context, null, 0, 10)
    const focus = frame.leaderMind.scratchPoints.focus
    if (!focus) return zeroVector
    const clock = frame.leaderMind.behaviorElapsed
    mind.scratchPoints.gaze = { x: focus.x, y: focus.y - 30 }
    if (clock < 1.8 && !frame.isLeader) {
      const spot = clampToBounds({ x: frame.leader.position.x + frame.rank * 40 * cat.coat.scale * (frame.rank % 2 === 0 ? 1 : -1), y: frame.leader.position.y + frame.rank * 6 }, context.bounds)
      if (distance(cat.position, spot) > 8) return arrive(cat, spot, paceSpeed(cat, mind, context, 0.4), 16)
    }
    faceToward(cat, mind, focus, 0.4)
    if (clock < 4.6) {
      mind.idlePose = 'sit'
      return brake(cat)
    }
    if (clock < 5.4) {
      mind.idlePose = 'crouch'
      return brake(cat)
    }
    if (mind.phase !== 'scatter') {
      mind.phase = 'scatter'
      hopInPlace(cat, mind, context, 26, 0.36, 'startle')
      setEmote(cat, 'startled')
      return zeroVector
    }
    if (frame.isLeader && clock > 6.4) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
