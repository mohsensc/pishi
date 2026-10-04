import type { Behavior } from '../behavior'
import { curveProgress, enterPhase, finishBehavior, followCurve, paceSpeed, phaseDone, roomyAnchor, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

const spinRate = 13
const span = 1.5

export const spiralInOutBehavior: Behavior = {
  id: 'spiralInOut',
  intent: 'play',
  interruptible: true,
  minDuration: 9,
  maxDuration: 14,
  weight: (_cat, mind) => 0.08 + mind.personality.curiosity * 0.1,
  start(cat, mind, context) {
    const radius = sizeScaled(context, 110)
    const around = randomOpenPoint(context, cat.position, sizeScaled(context, 140), 30)
    mind.scratchPoints.anchor = roomyAnchor(context, around, radius, radius * 0.7)
    mind.scratchNumbers.radius = radius
    mind.scratchNumbers.direction = context.memory.random.sign()
    mind.movePose = 'stalk'
    mind.idlePose = 'sniff'
  },
  update(cat, mind, context) {
    const progress = curveProgress(mind)
    if (mind.phase === 'center') {
      if (phaseDone(mind)) enterPhase(mind, 'out')
      return brake(cat)
    }
    if (mind.phase === 'start' && progress > span / 2) {
      setEmote(cat, 'curious')
      enterPhase(mind, 'center', 0.9)
      return zeroVector
    }
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (progress > span) {
      mind.idlePose = 'sit'
      enterPhase(mind, 'done', 0.8)
      return zeroVector
    }
    mind.movePose = mind.phase === 'out' ? 'walk' : 'stalk'
    const { radius, direction } = mind.scratchNumbers
    const anchor = mind.scratchPoints.anchor
    const curve = (value: number) => {
      const shrink = 1 - 0.85 * Math.sin((Math.PI * Math.min(value, span)) / span)
      const theta = value * spinRate * direction
      return { x: anchor.x + Math.cos(theta) * radius * shrink, y: anchor.y + Math.sin(theta) * radius * shrink * 0.7 }
    }
    const pace = mind.phase === 'out' ? 0.58 : 0.3
    return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, pace), sizeScaled(context, 18))
  },
}
