import type { Behavior } from '../behavior'
import { setAction } from '../helpers/pose'
import { brake } from '../helpers/steering'
import { every } from './support/phases'

export const catnipStareBehavior: Behavior = {
  id: 'catnipStare',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: () => 0,
  start(cat, mind, context) {
    const random = context.memory.random
    mind.idlePose = 'sit'
    mind.scratchPoints.gaze = { x: cat.position.x + random.sign() * random.range(60, 140), y: cat.position.y - random.range(60, 130) }
    setAction(cat, 'catnipHigh')
  },
  update(cat, mind, context) {
    const random = context.memory.random
    if (mind.phaseTimer > 2) mind.idlePose = 'loaf'
    if (every(mind, context, 'flick', 1.8)) {
      mind.scratchPoints.gaze = { x: cat.position.x + random.sign() * random.range(40, 160), y: cat.position.y - random.range(40, 140) }
    }
    if (every(mind, context, 'high', 1.6)) setAction(cat, 'catnipHigh')
    return brake(cat)
  },
}
