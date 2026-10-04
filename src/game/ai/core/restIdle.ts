import type { Behavior } from '../behavior'
import { brake } from '../helpers/steering'

export const sitIdleBehavior: Behavior = {
  id: 'sitIdle',
  intent: 'wander',
  interruptible: true,
  minDuration: 0.8,
  maxDuration: 2,
  weight: () => 0.08,
  start(_cat, mind, context) {
    mind.idlePose = context.memory.random.pick(['sit', 'sit', 'loaf'] as const)
  },
  update: (cat) => brake(cat),
}
