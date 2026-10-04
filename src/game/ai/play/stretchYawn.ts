import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const stretchYawnBehavior: Behavior = {
  id: 'stretchYawn',
  intent: 'wander',
  interruptible: true,
  minDuration: 3.5,
  maxDuration: 5.5,
  weight: (_cat, mind) => 0.05 + mind.personality.laziness * 0.1,
  start(_cat, mind) {
    mind.idlePose = 'loaf'
    mind.movePose = 'walk'
    enterPhase(mind, 'wake', 0.5)
  },
  update(cat, mind, context) {
    if (!phaseDone(mind)) {
      if (mind.phase === 'step') return { x: cat.facing * 26, y: 0 }
      return brake(cat)
    }
    if (mind.phase === 'wake') {
      lockPose(mind, 'stretch', 1.3)
      mind.idlePose = 'sit'
      enterPhase(mind, 'yawn', 1.5)
      return zeroVector
    }
    if (mind.phase === 'yawn') {
      setEmote(cat, 'sleepy')
      enterPhase(mind, 'step', 0.9)
      return zeroVector
    }
    if (mind.phase === 'step') {
      lockPose(mind, 'stretch', 1.1)
      enterPhase(mind, 'shake', 1.2)
      return zeroVector
    }
    if (mind.phase === 'shake') {
      mind.idlePose = 'groom'
      enterPhase(mind, 'done', 1.3)
      return zeroVector
    }
    return finishBehavior(cat, mind, context)
  },
}
