import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const kneadGrassBehavior: Behavior = {
  id: 'kneadGrass',
  intent: 'wander',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind) => 0.05 + cat.affection * 0.1 + mind.personality.laziness * 0.05,
  start(_cat, mind, context) {
    mind.idlePose = 'knead'
    enterPhase(mind, 'knead', randomTimer(context, 2.5, 4))
  },
  update(cat, mind, context) {
    if (mind.phase === 'knead') {
      if (mind.phaseTimer > 1 && cat.emote === null && mind.attempts === 0) {
        mind.attempts = 1
        setEmote(cat, 'love')
      }
      if (phaseDone(mind)) {
        mind.idlePose = 'loaf'
        setEmote(cat, 'sleepy')
        enterPhase(mind, 'settle', randomTimer(context, 2, 4))
      }
      return brake(cat)
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return mind.phase === 'settle' ? brake(cat) : zeroVector
  },
}
