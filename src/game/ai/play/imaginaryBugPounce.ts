import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const imaginaryBugPounceBehavior: Behavior = {
  id: 'imaginaryBugPounce',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight: (_cat, mind) => 0.08 + mind.personality.zoominess * 0.08,
  start(cat, mind, context) {
    mind.scratchNumbers.pounces = context.memory.random.integer(3, 5)
    mind.idlePose = 'crouch'
    mind.scratchPoints.gaze = randomOpenPoint(context, cat.position, sizeScaled(context, 60), 20)
    enterPhase(mind, 'aim', randomTimer(context, 0.3, 0.6))
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    if (!phaseDone(mind)) return brake(cat, 6)
    if (mind.phase === 'aim') {
      const bug = mind.scratchPoints.gaze
      startLeap(cat, mind, context, bug, 0, context.memory.random.range(16, 30), 0.3, 'pounce', 'none')
      mind.attempts += 1
      enterPhase(mind, 'swat', 0.05)
      return zeroVector
    }
    if (mind.phase === 'swat') {
      lockPose(mind, 'bat', 0.25)
      if (mind.attempts >= mind.scratchNumbers.pounces) {
        setEmote(cat, context.memory.random.chance(0.5) ? 'proud' : 'annoyed')
        mind.idlePose = 'sit'
        enterPhase(mind, 'done', 1)
        return zeroVector
      }
      mind.scratchPoints.gaze = randomOpenPoint(context, cat.position, sizeScaled(context, 70), 20)
      enterPhase(mind, 'aim', randomTimer(context, 0.3, 0.7))
      return zeroVector
    }
    return finishBehavior(cat, mind, context)
  },
}
