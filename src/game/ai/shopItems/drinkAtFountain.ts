import { spawnEffect } from '../../effects'
import { setAction, setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { mouthPoint, randomTimer } from '../helpers/queries'
import { facingRingPoint } from './shopItemSpots'

export const drinkAtFountainBehavior = createPropVisit({
  id: 'drinkAtFountain',
  kinds: ['fountain', 'birdbath'],
  range: 720,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3, 5.5],
  capacity: 3,
  idlePose: 'eat',
  weight: (cat) => 0.07 + (1 - cat.fullness) * 0.12,
  spotFor: (prop, cat, context) => facingRingPoint(prop, cat, context, prop.kind === 'birdbath' ? 2 : 0),
  onArrive(cat) {
    setEmote(cat, 'curious')
  },
  onUse(cat, mind, context, prop) {
    mind.idlePose = 'eat'
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 1.1, 1.9)
    setAction(cat, 'munch')
    spawnEffect(context.world, 'splash', mouthPoint(cat), prop.kind === 'birdbath' ? 30 * context.memory.sizeScale : 0, prop.id, 0.2)
  },
})
