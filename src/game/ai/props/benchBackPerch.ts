import { createPerchRest } from '../helpers/perchRest'
import { benchBackSpot, inFrontOf } from '../helpers/propSpots'

export const benchBackPerchBehavior = createPerchRest({
  id: 'benchBackPerch',
  kinds: ['bench'],
  range: 520,
  minDuration: 6,
  maxDuration: 11,
  restPose: 'sit',
  weight: (_cat, mind) => 0.05 + mind.personality.jumpPower * 0.05,
  spotsFor: (bench, _cat, context) => [benchBackSpot(bench, -1, context), benchBackSpot(bench, 1, context)],
  approachFor: (bench, spot, cat, context) => inFrontOf(bench, cat, context, spot.spot.x - bench.position.x),
  onRest(cat, mind, context) {
    const sweep = Math.sin(cat.clock * 0.6)
    mind.scratchPoints.gaze = { x: cat.position.x + sweep * 220 * context.memory.sizeScale, y: cat.position.y + 60 }
    const cycle = Math.floor(mind.phaseTimer / 3) % 3
    mind.idlePose = cycle === 1 ? 'groom' : 'sit'
  },
})
