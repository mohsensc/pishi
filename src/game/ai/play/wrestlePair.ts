import type { Behavior } from '../behavior'
import { distance, lerpVec } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, orbit } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const wrestleId = 'wrestlePair'

export const wrestlePairBehavior: Behavior = {
  id: wrestleId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 8,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.16 + mind.personality.boldness * 0.12 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'wrestle'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, wrestleId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    const partner = frame.isLeader ? frame.partners[0] : frame.leader
    if (frame.isLeader && !mind.scratchPoints.center) mind.scratchPoints.center = lerpVec(cat.position, partner.position, 0.5)
    const center = frame.leaderMind.scratchPoints.center
    if (!center) return zeroVector
    mind.scratchPoints.gaze = partner.position
    if (mind.phase === 'start') {
      if (distance(cat.position, partner.position) < 40 * cat.coat.scale || mind.phaseTimer > 4) {
        setEmote(cat, 'playful')
        enterPhase(mind, 'tussle', randomTimer(context, 3.5, 5.5))
        mind.movePose = 'wrestle'
        return zeroVector
      }
      return arrive(cat, center, paceSpeed(cat, mind, context, 0.5), 10)
    }
    if (frame.isLeader && phaseDone(mind)) {
      setEmote(cat, context.memory.random.chance(0.5) ? 'proud' : 'love')
      return finishBehavior(cat, mind, context)
    }
    if (context.memory.random.chance(context.dt * 0.9)) {
      hopInPlace(cat, mind, context, 10, 0.22, 'pounce')
      return zeroVector
    }
    mind.idlePose = !frame.isLeader && Math.sin(mind.phaseTimer * 2) > 0.6 ? 'bellyUp' : 'wrestle'
    return orbit(cat, center, 13 * cat.coat.scale, paceSpeed(cat, mind, context, 0.32), 1)
  },
}
