import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, headingVelocity, paceSpeed, phaseDone } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { subtract } from '../../vector'

export const phantomSpookBehavior: Behavior = {
  id: 'phantomSpook',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind) => 0.04 + (1 - mind.personality.spookResistance) * 0.08,
  start(cat, mind, context) {
    const random = context.memory.random
    mind.scratchPoints.spook = { x: cat.position.x + random.range(-40, 40), y: cat.position.y + random.range(-30, 30) }
    mind.idlePose = 'sit'
    hopInPlace(cat, mind, context, 30 + 12 * mind.personality.jumpPower, 0.4, 'startle', 'startle')
    setEmote(cat, 'startled')
    enterPhase(mind, 'arch', 0.1)
  },
  update(cat, mind, context) {
    const spook = mind.scratchPoints.spook
    if (!phaseDone(mind)) {
      if (mind.phase === 'bolt') return headingVelocity(subtract(cat.position, spook), paceSpeed(cat, mind, context, 0.9))
      return brake(cat)
    }
    if (mind.phase === 'arch') {
      lockPose(mind, 'arch', 0.6)
      enterPhase(mind, 'bolt', randomTimer(context, 0.7, 1.1))
      return zeroVector
    }
    if (mind.phase === 'bolt') {
      mind.scratchPoints.gaze = spook
      cat.facing = spook.x >= cat.position.x ? 1 : -1
      mind.facingHold = 1.4
      enterPhase(mind, 'stare', randomTimer(context, 1.2, 1.8))
      return zeroVector
    }
    if (mind.phase === 'stare') {
      delete mind.scratchPoints.gaze
      mind.idlePose = 'groom'
      setEmote(cat, 'annoyed')
      enterPhase(mind, 'done', randomTimer(context, 1, 1.6))
      return zeroVector
    }
    return finishBehavior(cat, mind, context)
  },
}
