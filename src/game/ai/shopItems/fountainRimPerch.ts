import { spawnEffect } from '../../effects'
import { createPerchRest } from '../helpers/perchRest'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer } from '../helpers/queries'
import { facingRingPoint, fountainRimSpots } from './shopItemSpots'

export const fountainRimPerchBehavior = createPerchRest({
  id: 'fountainRimPerch',
  kinds: ['fountain'],
  range: 640,
  minDuration: 6,
  maxDuration: 11,
  restPose: 'loaf',
  threatFactor: 0.5,
  weight: (_cat, mind) => 0.04 + mind.personality.curiosity * 0.08,
  spotsFor: (fountain, _cat, context) => fountainRimSpots(fountain, context),
  approachFor: (fountain, _spot, cat, context) => facingRingPoint(fountain, cat, context, 6),
  onSettle(cat, mind, context) {
    setEmote(cat, 'curious')
    mind.decisionTimer = randomTimer(context, 1.5, 3)
  },
  onRest(cat, mind, context, fountain) {
    mind.scratchPoints.gaze = { x: fountain.position.x + Math.sin(cat.clock * 0.7) * fountain.radius * 0.4, y: fountain.position.y - fountain.radius * 0.2 }
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 2.2, 4)
    if (context.memory.random.chance(0.55)) {
      lockPose(mind, 'bat', 0.4)
      spawnEffect(context.world, 'splash', { x: (cat.position.x + fountain.position.x) / 2, y: fountain.position.y }, 0, fountain.id, 0.3)
      return
    }
    mind.idlePose = context.memory.random.chance(0.5) ? 'loaf' : 'sit'
  },
})
