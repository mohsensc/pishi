import { clampToBounds } from '../../bounds'
import { setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { nightness } from '../helpers/propUse'
import { catRadius, settleOnGround } from '../helpers/queries'

export const shadeNapBehavior = createPropVisit({
  id: 'shadeNap',
  intent: 'napping',
  kinds: ['tree'],
  range: 640,
  minDuration: 6,
  maxDuration: 11,
  useDuration: [5, 10],
  capacity: 2,
  speed: 0.32,
  idlePose: 'loaf',
  weight: (_cat, mind, context) => (mind.napCooldown <= 0 ? (0.03 + mind.personality.laziness * 0.22) * (1.4 - nightness(context.world)) : 0),
  spotFor(tree, cat, context) {
    const random = context.memory.random
    const offset = { x: random.sign() * tree.radius * random.range(1, 2.4), y: tree.radius * random.range(1.1, 1.8) }
    return settleOnGround(clampToBounds({ x: tree.position.x + offset.x, y: tree.position.y + offset.y }, context.bounds), context, catRadius(cat))
  },
  lookAt: (_tree, cat) => ({ x: cat.position.x + cat.facing * 60, y: cat.position.y }),
  onArrive(cat, mind) {
    setEmote(cat, 'sleepy')
    mind.napCooldown = 18
  },
  onUse(_cat, mind) {
    mind.idlePose = mind.phaseTimer > 1.4 ? 'sleep' : 'loaf'
  },
})
