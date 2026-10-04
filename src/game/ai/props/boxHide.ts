import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { depthScale } from '../../projection'
import type { CatState, PropState } from '../../types'
import { boxFront, hideIn, isBoxFree } from '../helpers/hiding'
import { startLeap } from '../helpers/leap'
import { faceToward, setEmote } from '../helpers/pose'
import { bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { canHideMore, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { threatened } from '../helpers/threat'

function peekOut(cat: CatState, mind: CatMind, context: StepContext, box: PropState): void {
  cat.hidden = false
  cat.height = 2
  cat.position = { x: box.position.x, y: box.position.y + 2 }
  cat.velocity = { x: 0, y: 0 }
  mind.idlePose = 'peek'
  cat.facing = context.memory.random.sign()
  bumpAgitation(box, 0.3)
  enterPhase(mind, 'peek', randomTimer(context, 1.2, 2.4))
}

function duckIn(cat: CatState, mind: CatMind, context: StepContext, box: PropState, minimum: number, maximum: number): void {
  hideIn(cat, mind, box, randomTimer(context, minimum, maximum), context)
  bumpAgitation(box, 0.45)
}

function hopOut(cat: CatState, mind: CatMind, context: StepContext, box: PropState): void {
  cat.hidden = false
  cat.propId = null
  cat.position = { x: box.position.x, y: box.position.y + 1 }
  cat.height = box.perchHeight * 0.6 * depthScale(box.position.y, context.world.height)
  bumpAgitation(box, 0.6)
  startLeap(cat, mind, context, boxFront(box, cat), 0, 16, 0.38, 'jump', 'ground')
}

export const boxHideBehavior: Behavior = {
  id: 'boxHide',
  intent: 'hide',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 8,
  maxDuration: 14,
  weight: (cat, mind, context) =>
    canHideMore(context) && hasProp(cat, context, ['cardboardBox'], 600, (box) => isBoxFree(box, context, cat.id)) ? 0.16 + (1 - mind.personality.boldness) * 0.14 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['cardboardBox'], 600, (box) => isBoxFree(box, context, cat.id))?.id ?? null
    mind.scratchNumbers.peeks = context.memory.random.integer(1, 3)
  },
  update(cat, mind, context) {
    const box = findProp(context, mind.propTargetId)
    if (!box) return finishUse(cat, mind, context)
    const peeks = mind.scratchNumbers.peeks ?? 0
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      const velocity = travel(cat, mind, context, boxFront(box, cat), 0.5, 16)
      if (velocity) return velocity
      if (!canHideMore(context) || !isBoxFree(box, context, cat.id)) return quit(cat, mind, context)
      duckIn(cat, mind, context, box, 2, 3.5)
      return zeroVector
    }
    if (isOvertime(cat)) {
      hopOut(cat, mind, context, box)
      return zeroVector
    }
    if (mind.phase === 'inside') {
      if (mind.phaseTimer < mind.holdDuration) return zeroVector
      if (peeks > 0) peekOut(cat, mind, context, box)
      else hopOut(cat, mind, context, box)
      return zeroVector
    }
    if (mind.phase === 'peek') {
      if (context.pointer.active) {
        mind.scratchPoints.gaze = context.pointer.position
        faceToward(cat, mind, context.pointer.position, 0.3)
      }
      if (threatened(cat, mind, context, 0.8) && canHideMore(context)) {
        setEmote(cat, 'startled')
        duckIn(cat, mind, context, box, 1.5, 3)
        return zeroVector
      }
      if (mind.phaseTimer < mind.holdDuration) return zeroVector
      mind.scratchNumbers.peeks = peeks - 1
      if (peeks - 1 > 0 && canHideMore(context)) duckIn(cat, mind, context, box, 1, 2.5)
      else hopOut(cat, mind, context, box)
      return zeroVector
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
    if (cat.propId && !cat.hidden && cat.height <= 2 && !mind.leap) {
      const box = findProp(context, cat.propId)
      cat.propId = null
      if (box) startLeap(cat, mind, context, boxFront(box, cat), 0, 18, 0.34, 'jump', 'none')
      else cat.height = 0
    }
  },
}
