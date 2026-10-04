import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState } from '../../types'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from '../tools/support/phases'
import { answeredSince, followSummonerId, isGrounded, isHeldByPointer, ringSpot, treatBagCallId } from './callQueries'

const callUrgency = 4.2
const answerWindow = 2.2

function shakeOf(context: StepContext) {
  const shake = context.world.treatBagShake
  return shake && context.world.time - shake.time < answerWindow ? shake : null
}

function eagerness(cat: CatState, laziness: number): number {
  return 0.35 + cat.affection * 0.4 + (1 - laziness) * 0.25 + (1 - cat.fullness) * 0.2
}

export const treatBagCallBehavior: Behavior = {
  id: treatBagCallId,
  intent: 'socialize',
  interruptible: true,
  recencyPenalty: 0,
  overridesCommitment: true,
  minDuration: 5,
  maxDuration: 7,
  weight: () => 0,
  urgency(cat, mind, context) {
    const shake = shakeOf(context)
    if (!shake || !isGrounded(cat, mind) || isHeldByPointer(cat, context)) return 0
    if (cat.behavior === followSummonerId || answeredSince(mind, treatBagCallId, shake.time)) return 0
    return callUrgency
  },
  start(cat, mind, context) {
    const shake = context.world.treatBagShake
    if (shake) mind.scratchPoints.call = { x: shake.position.x, y: shake.position.y }
    const willCome = context.memory.random.chance(Math.min(0.95, eagerness(cat, mind.personality.laziness)))
    mind.scratchNumbers.willCome = willCome ? 1 : 0
    const reaction = 0.12 + (distance(cat.position, mind.scratchPoints.call ?? cat.position) / 900) * 0.4
    enterPhase(mind, 'look', willCome ? reaction + context.memory.random.range(0, 0.35) : randomTimer(context, 1.2, 2))
    mind.idlePose = 'sit'
    mind.movePose = 'run'
    setEmote(cat, willCome ? 'playful' : 'curious')
  },
  update(cat, mind, context) {
    const call = mind.scratchPoints.call
    if (!call) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    mind.behaviorUrgency = callUrgency
    gazeAt(cat, mind, context.pointer.active ? context.pointer.position : call, 0.3)
    if (mind.phase === 'look') {
      if (!phaseDone(mind)) return brake(cat)
      if (mind.scratchNumbers.willCome !== 1) {
        endBehavior(cat, mind, context)
        return zeroVector
      }
      if (context.memory.random.chance(0.5)) hopInPlace(cat, mind, context, 14, 0.24, 'hop')
      enterPhase(mind, 'trot')
      mind.speedBoost = 1.05 + cat.affection * 0.15
      return zeroVector
    }
    if (mind.phase === 'trot') {
      const spot = ringSpot(cat, call, 70 * context.memory.sizeScale, context)
      if (distance(cat.position, spot) < 22 * cat.coat.scale || mind.phaseTimer > 5) {
        mind.speedBoost = 1
        mind.idlePose = 'beg'
        setEmote(cat, 'love')
        enterPhase(mind, 'beg', randomTimer(context, 1.6, 2.8))
        return brake(cat)
      }
      return arrive(cat, spot, topSpeed(cat, mind, context) * 0.85, 40)
    }
    if (phaseDone(mind)) {
      mind.idlePose = 'sit'
      endBehavior(cat, mind, context)
      return zeroVector
    }
    return brake(cat)
  },
}
