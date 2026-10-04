import { perchSpotFor } from '../helpers/perch'
import { createPerchRest } from '../helpers/perchRest'
import { setEmote } from '../helpers/pose'
import { inFrontOf } from '../helpers/propSpots'
import { nightness } from '../helpers/propUse'
import type { PerchSpot } from '../../memory'

export const benchNapBehavior = createPerchRest({
  id: 'benchNap',
  intent: 'napping',
  kinds: ['bench'],
  range: 560,
  minDuration: 6,
  maxDuration: 12,
  restPose: 'loaf',
  threatFactor: 0.45,
  weight: (_cat, mind, context) => (mind.napCooldown <= 0 ? (0.03 + mind.personality.laziness * 0.28) * (1 + nightness(context.world) * 1.5) : 0),
  spotsFor: (bench, _cat, context) =>
    [0, 1].map((level) => perchSpotFor(bench, level, context.world.height)).filter((spot): spot is PerchSpot => spot !== null),
  approachFor: (bench, spot, cat, context) => inFrontOf(bench, cat, context, spot.spot.x - bench.position.x),
  onSettle(cat, mind) {
    setEmote(cat, 'sleepy')
    mind.napCooldown = 20
  },
  onRest(_cat, mind) {
    mind.idlePose = mind.phaseTimer > mind.holdDuration ? 'sleep' : 'loaf'
  },
})
