import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { ringPoint } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { nearestButterfly, randomTimer } from '../helpers/queries'
import { nightness } from '../helpers/propUse'

export const lampLoungeBehavior = createPropVisit({
  id: 'lampLounge',
  kinds: ['lamppost'],
  range: 760,
  minDuration: 6,
  maxDuration: 12,
  useDuration: [5, 10],
  capacity: 3,
  idlePose: 'loaf',
  weight: (_cat, _mind, context) => 0.06 + nightness(context.world) * 0.2,
  filter: (lamp) => lamp.lit,
  spotFor: (lamp, cat, context) => ringPoint(lamp, cat, context, Math.PI / 2 + context.memory.random.range(-1, 1), 18 * context.memory.sizeScale),
  lookAt: (lamp, _cat, context) => ({ x: lamp.position.x, y: lamp.position.y - 150 * context.memory.sizeScale }),
  onArrive(cat) {
    setEmote(cat, 'curious')
  },
  onUse(cat, mind, context) {
    mind.idlePose = mind.phaseTimer > 3 ? 'loaf' : 'sit'
    const butterfly = nearestButterfly(cat, context, 70 * context.memory.sizeScale)
    if (!butterfly || mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 1.2, 2.2)
    mind.scratchPoints.gaze = { x: butterfly.position.x, y: butterfly.position.y - butterfly.height }
    hopInPlace(cat, mind, context, 22 * mind.personality.jumpPower, 0.34, 'bat', 'none')
  },
})
