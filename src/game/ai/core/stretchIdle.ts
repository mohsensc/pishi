import type { Behavior } from '../behavior'
import { lockPose } from '../helpers/pose'
import { brake } from '../helpers/steering'

export const stretchIdleBehavior: Behavior = {
  id: 'stretchIdle',
  intent: 'wander',
  interruptible: true,
  minDuration: 1.4,
  maxDuration: 2,
  weight: () => 0.07,
  start(_cat, mind) {
    mind.idlePose = 'sit'
    lockPose(mind, 'stretch', 1.3)
  },
  update: (cat) => brake(cat),
}
