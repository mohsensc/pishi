import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { arrive, brake, orbit } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const rubId = 'headbuttRub'

export const headbuttRubBehavior: Behavior = {
  id: rubId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 7,
  maxDuration: 10,
  weight: (cat, _mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.06 + cat.affection * 0.16 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
    mind.scratchNumbers.direction = 1
    mind.scratchNumbers.switchAt = 1.2
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, rubId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    if (!frame.isLeader) {
      mind.idlePose = frame.leaderMind.phase === 'weave' ? 'purr' : 'sit'
      mind.scratchPoints.gaze = frame.leader.position
      return brake(cat)
    }
    const partner = frame.partners[0]
    mind.scratchPoints.gaze = partner.position
    const radius = 22 * cat.coat.scale
    if (mind.phase === 'start') {
      if (distance(cat.position, partner.position) < radius * 1.5 || mind.phaseTimer > 5) {
        mind.phase = 'weave'
        mind.phaseTimer = 0
        setEmote(cat, 'love')
      }
      return arrive(cat, partner.position, paceSpeed(cat, mind, context, 0.3), 20)
    }
    if (mind.phaseTimer > 4.5) {
      setEmote(partner, 'love')
      return finishBehavior(cat, mind, context)
    }
    if (mind.phaseTimer > mind.scratchNumbers.switchAt) {
      mind.scratchNumbers.switchAt = mind.phaseTimer + 1.2
      mind.scratchNumbers.direction *= -1
      faceToward(cat, mind, partner.position, 0.3)
      if (cat.emote === null) setEmote(cat, 'love')
    }
    const direction: 1 | -1 = mind.scratchNumbers.direction > 0 ? 1 : -1
    return orbit(cat, partner.position, radius, paceSpeed(cat, mind, context, 0.2), direction)
  },
}
