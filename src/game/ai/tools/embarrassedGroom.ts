import type { Behavior } from '../behavior'
import { brake } from '../helpers/steering'

export const embarrassedGroomBehavior: Behavior = {
  id: 'embarrassedGroom',
  intent: 'wander',
  interruptible: true,
  minDuration: 1.8,
  maxDuration: 3.2,
  weight: () => 0,
  start(cat, mind, context) {
    mind.idlePose = 'groom'
    const turnAway: 1 | -1 = context.pointer.position.x > cat.position.x ? -1 : 1
    cat.facing = turnAway
    mind.facingHold = 3
    mind.scratchPoints.gaze = { x: cat.position.x + turnAway * 60, y: cat.position.y + 10 }
  },
  update(cat, mind) {
    mind.idlePose = 'groom'
    return brake(cat)
  },
}
