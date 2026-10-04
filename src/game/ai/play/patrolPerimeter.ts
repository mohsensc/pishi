import type { Behavior } from '../behavior'
import { boundsCenter } from '../../bounds'
import { curveProgress, enterPhase, finishBehavior, followCurve, paceSpeed, perimeterPoint, perimeterProgressNear, phaseDone, sizeScaled } from '../helpers/playSteering'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const patrolPerimeterBehavior: Behavior = {
  id: 'patrolPerimeter',
  intent: 'explore',
  interruptible: true,
  minDuration: 9,
  maxDuration: 13,
  weight: (_cat, mind) => 0.07 + mind.personality.boldness * 0.1,
  start(cat, mind, context) {
    const inset = sizeScaled(context, 14)
    mind.scratchNumbers.origin = perimeterProgressNear(context.bounds, inset, cat.position)
    mind.scratchNumbers.direction = context.memory.random.sign()
    mind.scratchNumbers.nextStop = 0.1
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const progress = curveProgress(mind)
    if (mind.phase === 'lookout') {
      const center = boundsCenter(context.bounds)
      mind.scratchPoints.gaze = { x: cat.position.x * 2 - center.x, y: cat.position.y * 2 - center.y }
      if (phaseDone(mind)) {
        delete mind.scratchPoints.gaze
        enterPhase(mind, 'walk')
      }
      return brake(cat)
    }
    if (progress > 0.35) return finishBehavior(cat, mind, context)
    if (progress > mind.scratchNumbers.nextStop) {
      mind.scratchNumbers.nextStop = progress + context.memory.random.range(0.08, 0.16)
      enterPhase(mind, 'lookout', randomTimer(context, 0.8, 1.6))
      return zeroVector
    }
    const inset = sizeScaled(context, 14)
    const { origin, direction } = mind.scratchNumbers
    const curve = (value: number) => perimeterPoint(context.bounds, inset, origin + direction * value)
    return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, 0.3), sizeScaled(context, 24))
  },
}
