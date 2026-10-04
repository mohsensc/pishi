import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, phaseDone } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const swatAtAirBehavior: Behavior = {
  id: 'swatAtAir',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind) => 0.06 + mind.personality.zoominess * 0.08,
  start(cat, mind, context) {
    mind.idlePose = 'reach'
    mind.scratchNumbers.swats = context.memory.random.integer(3, 6)
    enterPhase(mind, 'watch', randomTimer(context, 0.4, 0.8))
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const drift = Math.sin(cat.clock * 3.1) * 30
    mind.scratchPoints.gaze = { x: cat.position.x + cat.facing * 20 + drift, y: cat.position.y - 70 }
    if (!phaseDone(mind)) return brake(cat, 6)
    if (mind.phase === 'done') return finishBehavior(cat, mind, context)
    mind.attempts += 1
    if (mind.attempts > mind.scratchNumbers.swats) {
      mind.idlePose = 'sit'
      setEmote(cat, 'annoyed')
      enterPhase(mind, 'done', 0.9)
      return zeroVector
    }
    if (mind.attempts % 2 === 0) hopInPlace(cat, mind, context, 14 + 10 * mind.personality.jumpPower, 0.3, 'reach')
    else lockPose(mind, 'bat', 0.22)
    if (context.memory.random.chance(0.4)) {
      cat.facing = cat.facing === 1 ? -1 : 1
      mind.facingHold = 0.4
    }
    enterPhase(mind, 'swat', randomTimer(context, 0.25, 0.5))
    return zeroVector
  },
}
