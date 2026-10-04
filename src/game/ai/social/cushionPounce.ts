import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { clampToBounds } from '../../bounds'
import { distance, normalize, scale, subtract, add } from '../../vector'
import type { CatState, PropState } from '../../types'
import { enterPhase, finishBehavior, lateralWiggle, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { isPropBusy, pickProp } from '../helpers/propUse'
import { findProp, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

const pounceId = 'cushionPounce'
const cushionKinds = ['cushion'] as const

function freeCushion(cat: CatState, context: StepContext): PropState | undefined {
  return pickProp(cat, context, cushionKinds, 760, (prop) => !isPropBusy(context, prop, cat.id, 1))
}

export const cushionPounceBehavior: Behavior = {
  id: pounceId,
  intent: 'useProp',
  interruptible: true,
  minDuration: 7,
  maxDuration: 10,
  weight: (cat, mind, context) => (freeCushion(cat, context) ? 0.25 + mind.personality.zoominess * 0.35 + mind.personality.boldness * 0.1 : 0),
  start(cat, mind, context) {
    const cushion = freeCushion(cat, context)
    mind.propTargetId = cushion?.id ?? null
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
    if (!cushion) return
    const away = normalize(subtract(cat.position, cushion.position))
    const direction = away.x === 0 && away.y === 0 ? { x: -1, y: 0 } : away
    mind.scratchPoints.launch = clampToBounds(add(cushion.position, scale(direction, sizeScaled(context, 95))), context.bounds)
  },
  update(cat, mind, context) {
    const cushion = findProp(context, mind.propTargetId)
    const launch = mind.scratchPoints.launch
    if (!cushion || !launch) return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = cushion.position
    if (mind.phase === 'start') {
      if (distance(cat.position, launch) < 14 * cat.coat.scale || mind.phaseTimer > 7) {
        enterPhase(mind, 'wiggle', randomTimer(context, 0.45, 0.8))
        setEmote(cat, 'playful')
        return brake(cat)
      }
      return arrive(cat, launch, paceSpeed(cat, mind, context, 0.3), 30)
    }
    if (mind.phase === 'wiggle') {
      if (!phaseDone(mind)) return add(brake(cat, 3), lateralWiggle(cat, 14, 3.6))
      startLeap(cat, mind, context, cushion.position, 0, 30 * mind.personality.jumpPower + 12, 0.42, 'pounce', 'none')
      enterPhase(mind, 'flurry', randomTimer(context, 1, 1.6))
      mind.idlePose = 'knead'
      return zeroVector
    }
    if (mind.phase === 'flurry') {
      cushion.agitation = Math.max(cushion.agitation, 0.35)
      if (phaseDone(mind)) {
        mind.idlePose = 'bellyUp'
        setEmote(cat, 'love')
        enterPhase(mind, 'roll', randomTimer(context, 1.4, 2.4))
      }
      return brake(cat)
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
  finish(_cat, mind) {
    mind.propTargetId = null
    mind.idlePose = 'sit'
  },
}
