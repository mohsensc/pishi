import { spawnEffect } from '../../effects'
import { setAction } from '../helpers/pose'
import { pondEdge } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { mouthPoint, randomTimer } from '../helpers/queries'

export const drinkAtPondBehavior = createPropVisit({
  id: 'drinkAtPond',
  kinds: ['pond'],
  range: 700,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3, 5.5],
  capacity: 3,
  idlePose: 'eat',
  weight: (cat) => 0.06 + (1 - cat.fullness) * 0.1,
  spotFor: (pond, cat, context) => pondEdge(pond, cat.position, cat, context),
  onUse(cat, mind, context) {
    mind.idlePose = 'eat'
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 1.2, 2)
    setAction(cat, 'munch')
    spawnEffect(context.world, 'splash', mouthPoint(cat), 0, mind.propTargetId, 0.2)
  },
})
