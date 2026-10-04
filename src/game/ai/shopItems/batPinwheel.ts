import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid } from '../helpers/propSpots'
import { bumpAgitation } from '../helpers/propUse'
import { createPropVisit } from '../helpers/propVisit'
import { randomTimer } from '../helpers/queries'
import { headPoint } from './shopItemSpots'

export const batPinwheelBehavior = createPropVisit({
  id: 'batPinwheel',
  intent: 'play',
  kinds: ['pinwheel', 'windmill'],
  range: 600,
  minDuration: 4,
  maxDuration: 8,
  useDuration: [3, 5.5],
  weight: (_cat, mind) => 0.05 + mind.personality.curiosity * 0.1,
  spotFor: (prop, cat, context) => besideSolid(prop, cat, context, cat.position.x < prop.position.x ? -1 : 1, 6),
  lookAt: (prop, _cat, context) => headPoint(prop, context, prop.kind === 'windmill' ? 150 : 58),
  onArrive(cat) {
    setEmote(cat, 'curious')
  },
  onUse(cat, mind, context, prop) {
    mind.scratchPoints.gaze = headPoint(prop, context, prop.kind === 'windmill' ? 150 : 58)
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.9, 1.6)
    if (prop.kind === 'windmill' || context.memory.random.chance(0.45)) {
      lockPose(mind, 'reach', 0.7)
      if (prop.kind === 'pinwheel') bumpAgitation(prop, 0.8)
      return
    }
    bumpAgitation(prop, 1)
    hopInPlace(cat, mind, context, randomTimer(context, 18, 34) * mind.personality.jumpPower, 0.36, 'bat', 'none')
  },
})
