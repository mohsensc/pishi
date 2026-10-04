import { createPerchRest } from '../helpers/perchRest'
import { setEmote } from '../helpers/pose'
import { basketSpot, besideSolid, sideToward } from '../helpers/propSpots'

export const yarnBasketSitBehavior = createPerchRest({
  id: 'yarnBasketSit',
  kinds: ['yarnBasket'],
  range: 520,
  minDuration: 6,
  maxDuration: 12,
  restPose: 'loaf',
  mountPose: 'hop',
  threatFactor: 0.55,
  weight: (_cat, mind) => 0.06 + mind.personality.laziness * 0.1,
  spotsFor: (basket, _cat, context) => [basketSpot(basket, context)],
  approachFor: (basket, _spot, cat, context) => besideSolid(basket, cat, context, sideToward(basket, cat.position)),
  onSettle(cat) {
    setEmote(cat, 'love')
  },
  onRest(_cat, mind) {
    if (mind.phaseTimer < 2) mind.idlePose = 'knead'
    else mind.idlePose = mind.phaseTimer > 5 ? 'sleep' : 'loaf'
  },
})
