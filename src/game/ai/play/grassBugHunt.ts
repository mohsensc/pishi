import type { Behavior } from '../behavior'
import { add } from '../../vector'
import { enterPhase, finishBehavior, lateralWiggle, phaseDone } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const grassBugHuntBehavior: Behavior = {
  id: 'grassBugHunt',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind) => 0.06 + mind.personality.curiosity * 0.1,
  start(cat, mind, context) {
    mind.scratchPoints.gaze = { x: cat.position.x + cat.facing * 26, y: cat.position.y + 4 }
    mind.idlePose = 'sniff'
    enterPhase(mind, 'sniff', randomTimer(context, 0.8, 1.4))
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    if (mind.phase === 'sniff') {
      if (phaseDone(mind)) {
        mind.idlePose = 'crouch'
        mind.movePose = 'crouch'
        enterPhase(mind, 'wiggle', randomTimer(context, 0.7, 1.2))
      }
      return brake(cat)
    }
    if (mind.phase === 'wiggle') {
      if (phaseDone(mind)) {
        mind.attempts += 1
        hopInPlace(cat, mind, context, 8, 0.2, 'pounce')
        enterPhase(mind, 'swat', 0.05)
        return zeroVector
      }
      return add(brake(cat, 2), lateralWiggle(cat, 18, 3.6))
    }
    if (mind.phase === 'swat') {
      lockPose(mind, 'bat', 0.28)
      if (mind.attempts >= 3 || context.memory.random.chance(0.3)) {
        mind.idlePose = 'sit'
        setEmote(cat, 'playful')
        enterPhase(mind, 'done', 1.1)
      } else enterPhase(mind, 'wiggle', randomTimer(context, 0.5, 0.9))
      return zeroVector
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
