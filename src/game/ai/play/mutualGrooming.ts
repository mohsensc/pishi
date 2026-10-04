import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { arrive, brake } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const groomId = 'mutualGrooming'

export const mutualGroomingBehavior: Behavior = {
  id: groomId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (cat, _mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.12 + cat.affection * 0.2 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, groomId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    const partner = frame.isLeader ? frame.partners[0] : frame.leader
    const clock = frame.leaderMind.behaviorElapsed
    if (frame.isLeader && clock > 7.5) return finishBehavior(cat, mind, context)
    faceToward(cat, mind, partner.position, 0.4)
    mind.scratchPoints.gaze = partner.position
    if (!frame.isLeader) {
      const side = cat.position.x >= frame.leader.position.x ? 1 : -1
      const spot = clampToBounds({ x: frame.leader.position.x + side * 30 * cat.coat.scale, y: frame.leader.position.y + 2 }, context.bounds)
      if (distance(cat.position, spot) > 6) return arrive(cat, spot, paceSpeed(cat, mind, context, 0.3), 16)
    }
    const together = distance(cat.position, partner.position) < 44 * cat.coat.scale
    if (!together) {
      mind.idlePose = 'sit'
      return brake(cat)
    }
    const leaderTurn = Math.floor(clock / 2.4) % 2 === 0
    const grooming = frame.isLeader === leaderTurn
    mind.idlePose = grooming ? 'groom' : 'loaf'
    if (!grooming && cat.emote === null && context.memory.random.chance(context.dt * 0.6)) setEmote(cat, 'love')
    return brake(cat)
  },
}
