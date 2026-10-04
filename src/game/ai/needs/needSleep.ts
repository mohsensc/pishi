import type { Behavior } from '../behavior'
import { needSleepId } from '../../needs/needIds'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'

const settleSeconds = 1.3
const sleepHoldSeconds = 600

export const needSleepBehavior: Behavior = {
  id: needSleepId,
  intent: 'napping',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: sleepHoldSeconds,
  maxDuration: sleepHoldSeconds,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'loaf'
    mind.movePose = null
    setEmote(cat, 'sleepy')
  },
  update(cat, mind, context) {
    if (!cat.asleep) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.idlePose = mind.phaseTimer < settleSeconds ? 'loaf' : 'sleep'
    mind.scratchPoints.gaze = { x: cat.position.x + cat.facing * 40, y: cat.position.y + 6 }
    return brake(cat)
  },
}
