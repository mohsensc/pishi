import { perchSpotFor } from '../helpers/perch'
import { createPerchRest } from '../helpers/perchRest'
import { faceToward } from '../helpers/pose'
import { inFrontOf } from '../helpers/propSpots'
import type { PerchSpot } from '../../memory'

export const rockSurveyBehavior = createPerchRest({
  id: 'rockSurvey',
  kinds: ['rock'],
  range: 520,
  minDuration: 5,
  maxDuration: 10,
  restPose: 'sit',
  mountPose: 'hop',
  weight: (_cat, mind) => 0.05 + mind.personality.curiosity * 0.07,
  spotsFor: (rock, _cat, context) => [perchSpotFor(rock, 0, context.world.height)].filter((spot): spot is PerchSpot => spot !== null),
  approachFor: (rock, _spot, cat, context) => inFrontOf(rock, cat, context),
  onRest(cat, mind, context) {
    const lookAround = { x: cat.position.x + Math.cos(cat.clock * 0.45) * 260 * context.memory.sizeScale, y: cat.position.y + Math.sin(cat.clock * 0.3) * 120 }
    mind.scratchPoints.gaze = lookAround
    if (mind.facingHold <= 0 && Math.floor(mind.phaseTimer / 2.4) % 2 === 1) faceToward(cat, mind, lookAround, 2.4)
    mind.idlePose = mind.phaseTimer > 4 ? 'loaf' : 'sit'
  },
})
