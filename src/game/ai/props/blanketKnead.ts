import { clampToBounds } from '../../bounds'
import { setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { bumpAgitation } from '../helpers/propUse'
import { randomTimer } from '../helpers/queries'

export const blanketKneadBehavior = createPropVisit({
  id: 'blanketKnead',
  kinds: ['picnicBlanket'],
  range: 680,
  minDuration: 6,
  maxDuration: 11,
  useDuration: [5, 9],
  capacity: 2,
  speed: 0.34,
  idlePose: 'knead',
  weight: (cat, mind) => 0.05 + mind.personality.laziness * 0.06 + cat.affection * 0.08,
  spotFor(blanket, _cat, context) {
    const random = context.memory.random
    return clampToBounds({ x: blanket.position.x + random.range(-0.45, 0.45) * blanket.radius, y: blanket.position.y + random.range(-0.2, 0.2) * blanket.radius }, context.bounds)
  },
  lookAt: (_blanket, cat) => ({ x: cat.position.x + cat.facing * 50, y: cat.position.y }),
  onArrive(cat) {
    setEmote(cat, 'love')
  },
  onUse(_cat, mind, context, blanket) {
    const kneading = mind.phaseTimer < mind.holdDuration * 0.55
    mind.idlePose = kneading ? 'knead' : 'loaf'
    if (!kneading || mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 1.4, 2.2)
    bumpAgitation(blanket, 0.12)
  },
})
