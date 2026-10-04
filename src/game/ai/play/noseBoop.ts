import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance, lerpVec } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { bodyLength, mindOf, zeroVector } from '../helpers/queries'
import { startleHop } from '../helpers/reactions'
import { arrive, brake } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const boopId = 'noseBoop'

export const noseBoopBehavior: Behavior = {
  id: boopId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.1 + mind.personality.curiosity * 0.08 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sniff'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, boopId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    const partner = frame.isLeader ? frame.partners[0] : frame.leader
    if (frame.isLeader && !mind.scratchPoints.meet) mind.scratchPoints.meet = lerpVec(cat.position, partner.position, 0.5)
    const meet = frame.leaderMind.scratchPoints.meet
    if (!meet) return zeroVector
    mind.scratchPoints.gaze = partner.position
    if (mind.phase === 'start') {
      const side = frame.isLeader ? (cat.position.x <= partner.position.x ? -1 : 1) : (cat.position.x < frame.leader.position.x ? -1 : 1)
      const spot = clampToBounds({ x: meet.x + side * bodyLength(cat) * 0.42, y: meet.y }, context.bounds)
      if (distance(cat.position, partner.position) < bodyLength(cat) * 0.95 || mind.phaseTimer > 5) {
        faceToward(cat, mind, partner.position, 2)
        enterPhase(mind, 'boop', 1.1)
        setEmote(cat, 'curious')
        return zeroVector
      }
      return arrive(cat, spot, paceSpeed(cat, mind, context, 0.3), 16)
    }
    if (mind.phase === 'boop') {
      if (phaseDone(mind)) {
        if (frame.isLeader && context.memory.random.chance(0.35)) {
          startleHop(partner, mindOf(partner, context), context, cat.position, 22)
          setEmote(cat, 'playful')
        } else setEmote(cat, 'love')
        mind.idlePose = 'sit'
        enterPhase(mind, 'after', 1.4)
      }
      return brake(cat)
    }
    if (frame.isLeader && phaseDone(mind)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
