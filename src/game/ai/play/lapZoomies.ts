import type { Behavior } from '../behavior'
import { curveProgress, enterPhase, finishBehavior, followCurve, isDusk, paceSpeed, perimeterPoint, perimeterProgressNear, phaseDone, sizeScaled } from '../helpers/playSteering'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const lapZoomiesBehavior: Behavior = {
  id: 'lapZoomies',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 14,
  weight: (_cat, mind, context) => mind.personality.zoominess * 0.2 * (isDusk(context) ? 3 : 1),
  start(cat, mind, context) {
    const inset = sizeScaled(context, 36)
    mind.scratchNumbers.origin = perimeterProgressNear(context.bounds, inset, cat.position)
    mind.scratchNumbers.direction = context.memory.random.sign()
    mind.scratchNumbers.laps = context.memory.random.range(0.5, 0.8)
    mind.idlePose = 'sit'
    mind.speedBoost = 1.15
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'flop') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (curveProgress(mind) >= mind.scratchNumbers.laps) {
      mind.speedBoost = 1
      mind.idlePose = 'loaf'
      lockPose(mind, 'flop', 0.8)
      enterPhase(mind, 'flop', 1.4)
      return zeroVector
    }
    const inset = sizeScaled(context, 36)
    const { origin, direction } = mind.scratchNumbers
    const curve = (progress: number) => perimeterPoint(context.bounds, inset, origin + direction * progress)
    return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, 1), sizeScaled(context, 44))
  },
}
