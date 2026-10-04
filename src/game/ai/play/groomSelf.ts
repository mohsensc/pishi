import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const groomSelfBehavior: Behavior = {
  id: 'groomSelf',
  intent: 'wander',
  interruptible: true,
  minDuration: 3,
  maxDuration: 5,
  weight: (cat, mind) => 0.08 + mind.personality.laziness * 0.08 + (cat.coat.breed === 'persian' ? 0.1 : 0),
  start(_cat, mind, context) {
    mind.idlePose = 'groom'
    mind.scratchNumbers.rounds = context.memory.random.integer(2, 4)
    enterPhase(mind, 'groom', randomTimer(context, 1.2, 2.2))
  },
  update(cat, mind, context) {
    if (!phaseDone(mind)) return brake(cat)
    if (mind.phase === 'groom') {
      mind.attempts += 1
      if (mind.attempts >= mind.scratchNumbers.rounds) return finishBehavior(cat, mind, context)
      mind.idlePose = 'sit'
      enterPhase(mind, 'pause', randomTimer(context, 0.4, 0.9))
      return zeroVector
    }
    cat.facing = cat.facing === 1 ? -1 : 1
    mind.facingHold = 0.8
    mind.idlePose = 'groom'
    enterPhase(mind, 'groom', randomTimer(context, 1.2, 2.2))
    return zeroVector
  },
}
