import type { Behavior } from '../behavior'
import { boundsCenter } from '../../bounds'
import { add, distance, normalize, scale, subtract } from '../../vector'
import { finishBehavior, headingVelocity, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { mindOf, zeroVector } from '../helpers/queries'
import { seek } from '../helpers/steering'
import { catAtRank, hasPartnerNearby, partnerReach, socialSetup } from './shared/partners'

const tagId = 'tag'

export const tagBehavior: Behavior = {
  id: tagId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 9,
  maxDuration: 13,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.1 + mind.personality.zoominess * 0.12 : 0),
  start(_cat, mind) {
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, tagId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    const game = frame.leaderMind.scratchNumbers
    if (frame.isLeader && game.it === undefined) {
      game.it = 0
      game.tags = 0
      game.cooldownUntil = context.world.time + 0.6
      setEmote(cat, 'playful')
    }
    if (frame.isLeader && game.tags >= 4) return finishBehavior(cat, mind, context)
    const other = catAtRank(frame, frame.rank === 0 ? 1 : 0)
    if (!other) return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = other.position
    if (game.it === frame.rank) {
      if (context.world.time < game.cooldownUntil) return zeroVector
      if (distance(cat.position, other.position) < 28 * cat.coat.scale) {
        game.it = frame.rank === 0 ? 1 : 0
        game.tags += 1
        game.cooldownUntil = context.world.time + 1.3
        hopInPlace(cat, mind, context, 16, 0.26, 'hop')
        setEmote(cat, 'playful')
        const otherMind = mindOf(other, context)
        if (!otherMind.leap) lockPose(otherMind, 'arch', 0.45)
        setEmote(other, 'startled')
        return zeroVector
      }
      return seek(cat, other.position, paceSpeed(cat, mind, context, 0.92))
    }
    const away = normalize(subtract(cat.position, other.position))
    const toCenter = normalize(subtract(boundsCenter(context.bounds), cat.position))
    const bounds = context.bounds
    const edge = Math.min(cat.position.x - bounds.left, bounds.right - cat.position.x, cat.position.y - bounds.top, bounds.bottom - cat.position.y)
    const pull = edge < sizeScaled(context, 70) ? 1.3 : 0.15
    return headingVelocity(add(away, scale(toCenter, pull)), paceSpeed(cat, mind, context, 0.8))
  },
}
