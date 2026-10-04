import type { Behavior } from '../behavior'
import { chooseEscape } from '../helpers/escape'
import { curveProgress, finishBehavior, followCurve, paceSpeed, roomyAnchor, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { threatened } from '../helpers/threat'
import { setBallDown } from './shared/ballPlay'

export const ballParadeBehavior: Behavior = {
  id: 'ballParade',
  intent: 'play',
  interruptible: true,
  withBall: true,
  minDuration: 5,
  maxDuration: 8,
  recencyPenalty: 0.95,
  weight: (_cat, mind) => 0.05 + mind.personality.boldness * 0.1,
  start(cat, mind, context) {
    const span = sizeScaled(context, 170)
    const direction = context.memory.random.sign()
    const anchor = roomyAnchor(context, { x: cat.position.x + direction * span, y: cat.position.y }, span, sizeScaled(context, 30))
    mind.scratchPoints.anchor = anchor
    mind.scratchNumbers.span = span
    mind.scratchNumbers.direction = direction
    mind.scratchNumbers.nextPrance = 0.9
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
    setEmote(cat, 'proud')
  },
  update(cat, mind, context) {
    if (!cat.heldBallId) return finishBehavior(cat, mind, context)
    if (threatened(cat, mind, context)) {
      chooseEscape(cat, mind, context, true)
      return zeroVector
    }
    if (curveProgress(mind) > 1) {
      if (context.memory.random.chance(0.5)) setBallDown(cat, mind, context)
      return finishBehavior(cat, mind, context)
    }
    if (mind.behaviorElapsed > mind.scratchNumbers.nextPrance) {
      mind.scratchNumbers.nextPrance = mind.behaviorElapsed + context.memory.random.range(0.9, 1.4)
      hopInPlace(cat, mind, context, 9, 0.22, 'hop')
      if (context.memory.random.chance(0.4)) setEmote(cat, 'proud')
      return zeroVector
    }
    const { span, direction } = mind.scratchNumbers
    const anchor = mind.scratchPoints.anchor
    const curve = (progress: number) => ({
      x: anchor.x - direction * span + direction * span * 2 * progress,
      y: anchor.y + Math.sin(progress * Math.PI * 3) * sizeScaled(context, 26),
    })
    return followCurve(cat, mind, context, curve, paceSpeed(cat, mind, context, 0.24), sizeScaled(context, 20))
  },
}
