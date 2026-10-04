import type { Behavior } from '../behavior'
import { boundsCenter } from '../../bounds'
import { length, normalize, perpendicular, rotate, scale, subtract } from '../../vector'
import { curveProgress, finishBehavior, followCurve, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { arrive } from '../helpers/steering'
import { catAtRank, hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const congaId = 'followLeader'

export const followLeaderBehavior: Behavior = {
  id: congaId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 9,
  maxDuration: 14,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.12 + mind.personality.boldness * 0.08 : 0),
  start(cat, mind, context) {
    const toCenter = normalize(subtract(boundsCenter(context.bounds), cat.position))
    const base = length(toCenter) > 0.5 ? toCenter : { x: cat.facing, y: 0 }
    mind.scratchPoints.origin = { x: cat.position.x, y: cat.position.y }
    mind.scratchPoints.heading = normalize(rotate(base, context.memory.random.range(-40, 40)))
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, congaId, sizeScaled(context, partnerReach), 3)
    if (!frame) return finishBehavior(cat, mind, context)
    if (frame.isLeader) {
      if (mind.behaviorElapsed < 0.1) setEmote(cat, 'proud')
      if (curveProgress(mind) > 1) return finishBehavior(cat, mind, context)
      const { origin, heading } = mind.scratchPoints
      const side = perpendicular(heading)
      const reach = sizeScaled(context, 420)
      const sway = sizeScaled(context, 46)
      const curve = (progress: number) => ({
        x: origin.x + heading.x * reach * progress + side.x * Math.sin(progress * 9) * sway,
        y: origin.y + heading.y * reach * progress + side.y * Math.sin(progress * 9) * sway,
      })
      return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, 0.26), sizeScaled(context, 22))
    }
    const ahead = catAtRank(frame, frame.rank - 1) ?? frame.leader
    if (mind.behaviorElapsed < 0.1) setEmote(cat, 'playful')
    const motion = length(ahead.velocity) > 8 ? normalize(ahead.velocity) : { x: ahead.facing, y: 0 }
    const slot = subtract(ahead.position, scale(motion, sizeScaled(context, 44)))
    return arrive(cat, slot, paceSpeed(cat, mind, context, 0.42), 30)
  },
}
