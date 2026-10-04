import { createPerchRest } from '../helpers/perchRest'
import { setEmote } from '../helpers/pose'
import { bumpAgitation, nightness } from '../helpers/propUse'
import { inFrontOf } from '../helpers/propSpots'
import { swingSeatSpot } from './shopItemSpots'

export const swingRideBehavior = createPerchRest({
  id: 'swingRide',
  kinds: ['swing'],
  range: 620,
  minDuration: 6,
  maxDuration: 12,
  restPose: 'loaf',
  threatFactor: 0.5,
  weight: (_cat, mind, context) => (0.05 + mind.personality.laziness * 0.12 + mind.personality.boldness * 0.06) * (1 + nightness(context.world) * 0.6),
  spotsFor: (swing, _cat, context) => [swingSeatSpot(swing, context)],
  approachFor: (swing, _spot, cat, context) => inFrontOf(swing, cat, context, 0),
  onSettle(cat, _mind, _context, swing) {
    setEmote(cat, 'love')
    bumpAgitation(swing, 0.6)
  },
  onRest(cat, mind, _context, swing) {
    mind.idlePose = mind.phaseTimer > 4 ? 'sleep' : 'loaf'
    if (Math.sin(cat.clock * 0.9) > 0.97) bumpAgitation(swing, 0.4)
  },
})
