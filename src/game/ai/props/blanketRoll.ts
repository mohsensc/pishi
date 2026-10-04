import { clampToBounds } from '../../bounds'
import { setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { bumpAgitation } from '../helpers/propUse'
import { randomTimer } from '../helpers/queries'

export const blanketRollBehavior = createPropVisit({
  id: 'blanketRoll',
  kinds: ['picnicBlanket'],
  range: 680,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3.5, 6.5],
  capacity: 2,
  idlePose: 'bellyUp',
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.08,
  spotFor(blanket, _cat, context) {
    const random = context.memory.random
    return clampToBounds({ x: blanket.position.x + random.range(-0.5, 0.5) * blanket.radius, y: blanket.position.y + random.range(-0.25, 0.25) * blanket.radius }, context.bounds)
  },
  lookAt: (_blanket, cat) => ({ x: cat.position.x + cat.facing * 40, y: cat.position.y - 40 }),
  onArrive(cat) {
    setEmote(cat, 'playful')
  },
  onUse(cat, mind, context, blanket) {
    mind.idlePose = 'bellyUp'
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.7, 1.3)
    cat.facing = cat.facing === 1 ? -1 : 1
    mind.facingHold = 0.7
    bumpAgitation(blanket, 0.25)
    if (context.memory.random.chance(0.2)) setEmote(cat, 'love')
  },
})
