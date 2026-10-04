import { setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { randomTimer } from '../helpers/queries'
import { facingRingPoint, headPoint } from './shopItemSpots'

export const windmillWatchBehavior = createPropVisit({
  id: 'windmillWatch',
  intent: 'explore',
  kinds: ['windmill', 'pinwheel'],
  range: 700,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [4, 7],
  capacity: 2,
  speed: 0.35,
  idlePose: 'sit',
  weight: (_cat, mind) => 0.03 + mind.personality.curiosity * 0.06,
  spotFor: (prop, cat, context) => facingRingPoint(prop, cat, context, prop.kind === 'windmill' ? 40 : 30),
  lookAt: (prop, _cat, context) => headPoint(prop, context, prop.kind === 'windmill' ? 150 : 58),
  onArrive(cat, mind, context) {
    setEmote(cat, 'curious')
    mind.decisionTimer = randomTimer(context, 1, 2)
  },
  onUse(cat, mind, context, prop) {
    const hub = headPoint(prop, context, prop.kind === 'windmill' ? 150 : 58)
    const sweep = (prop.kind === 'windmill' ? 70 : 22) * context.memory.sizeScale
    mind.scratchPoints.gaze = { x: hub.x + Math.cos(cat.clock * 2.4) * sweep, y: hub.y + Math.sin(cat.clock * 2.4) * sweep }
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 2, 3.5)
    mind.idlePose = context.memory.random.chance(0.3) ? 'loaf' : 'sit'
  },
})
