import type { Behavior } from '../behavior'
import { setEmote } from '../helpers/pose'
import { brake } from '../helpers/steering'

export const postMealGroomBehavior: Behavior = {
  id: 'postMealGroom',
  intent: 'wander',
  interruptible: true,
  minDuration: 3,
  maxDuration: 5,
  weight: () => 0,
  start(cat, mind, context) {
    mind.idlePose = 'groom'
    setEmote(cat, context.memory.random.chance(0.5) ? 'proud' : 'sleepy')
  },
  update(cat, mind) {
    mind.idlePose = mind.phaseTimer > 3.2 ? 'loaf' : 'groom'
    return brake(cat)
  },
}
