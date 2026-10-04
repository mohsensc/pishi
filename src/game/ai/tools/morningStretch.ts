import type { Behavior } from '../behavior'
import { isMorning } from '../../tools/dayCycle'
import { lockPose, setEmote } from '../helpers/pose'
import { brake } from '../helpers/steering'

export const morningStretchBehavior: Behavior = {
  id: 'morningStretch',
  intent: 'wander',
  interruptible: true,
  minDuration: 3,
  maxDuration: 4,
  weight: (_cat, mind, context) => (isMorning(context.world.dayTime) ? 0.2 + mind.personality.laziness * 0.3 : 0),
  start(cat, mind) {
    lockPose(mind, 'stretch', 1.2)
    setEmote(cat, 'sleepy')
    mind.idlePose = 'groom'
  },
  update(cat, mind) {
    mind.idlePose = mind.phaseTimer > 2.4 ? 'sit' : 'groom'
    return brake(cat)
  },
}
