import type { Behavior } from '../behavior'
import { curveProgress, finishBehavior, followCurve, paceSpeed, phaseDone, enterPhase, roomyAnchor, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

const loopRate = 10

export const figureEightBehavior: Behavior = {
  id: 'figureEight',
  intent: 'play',
  interruptible: true,
  minDuration: 8,
  maxDuration: 13,
  weight: (_cat, mind) => 0.1 + mind.personality.zoominess * 0.1,
  start(cat, mind, context) {
    const width = sizeScaled(context, 100)
    const around = randomOpenPoint(context, cat.position, sizeScaled(context, 120), 30)
    mind.scratchPoints.anchor = roomyAnchor(context, around, width, width * 0.5)
    mind.scratchNumbers.width = width
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    const angle = curveProgress(mind) * loopRate
    if (angle > Math.PI * 3) {
      setEmote(cat, 'proud')
      enterPhase(mind, 'done', 1)
      return zeroVector
    }
    const anchor = mind.scratchPoints.anchor
    const width = mind.scratchNumbers.width
    const curve = (progress: number) => {
      const theta = progress * loopRate
      return { x: anchor.x + Math.sin(theta) * width, y: anchor.y + Math.sin(theta) * Math.cos(theta) * width * 0.8 }
    }
    return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, 0.46), sizeScaled(context, 22))
  },
}
