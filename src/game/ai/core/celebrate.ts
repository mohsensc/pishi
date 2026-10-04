import type { Behavior } from '../behavior'
import { add } from '../../vector'
import { startLeap } from '../helpers/leap'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'

export const celebrateBehavior: Behavior = {
  id: 'celebrate',
  intent: 'celebrate',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 1,
  maxDuration: 1.6,
  weight: () => 0,
  start(_cat, mind, context) {
    mind.holdDuration = randomTimer(context, 0.05, 0.25)
  },
  update(cat, mind, context) {
    mind.idlePose = 'sit'
    if (cat.intentTimer <= 0) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) {
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.25, 0.6)
      const wiggle = mind.perch ? 0 : 28
      const hop = add(cat.position, { x: context.memory.random.range(-wiggle, wiggle), y: context.memory.random.range(-wiggle, wiggle) * 0.4 })
      startLeap(cat, mind, context, hop, cat.height, randomTimer(context, 18, 34) * mind.personality.jumpPower, 0.36, 'hop', 'none')
    }
    return brake(cat)
  },
}
