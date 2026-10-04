import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid } from '../helpers/propSpots'
import { bumpAgitation } from '../helpers/propUse'
import { createPropVisit } from '../helpers/propVisit'
import { randomTimer } from '../helpers/queries'
import { headPoint } from './shopItemSpots'

export const batSpringToyBehavior = createPropVisit({
  id: 'batSpringToy',
  intent: 'play',
  kinds: ['springToy'],
  range: 640,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3.5, 6.5],
  speed: 0.7,
  weight: (_cat, mind) => 0.07 + mind.personality.zoominess * 0.14,
  spotFor: (toy, cat, context) => besideSolid(toy, cat, context, cat.position.x < toy.position.x ? -1 : 1, 4),
  lookAt: (toy, _cat, context) => headPoint(toy, context, 40),
  onArrive(cat) {
    setEmote(cat, 'playful')
  },
  onUse(cat, mind, context, toy) {
    mind.scratchPoints.gaze = headPoint(toy, context, 40)
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.6, 1.2)
    toy.pokedAt = context.world.time
    bumpAgitation(toy, 1)
    if (context.memory.random.chance(0.4)) {
      lockPose(mind, 'bat', 0.4)
      return
    }
    hopInPlace(cat, mind, context, randomTimer(context, 16, 30) * mind.personality.jumpPower, 0.34, 'bat', 'none')
  },
})
