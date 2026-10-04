import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import type { CatState } from '../../types'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from '../tools/support/phases'

function chooseAftermath(cat: CatState, mind: CatMind, context: StepContext): void {
  const random = context.memory.random
  if (cat.affection > 0.6 && context.pointer.active && random.chance(0.7)) {
    enterPhase(mind, 'nuzzle', randomTimer(context, 1.4, 2.4))
    setEmote(cat, 'love')
    return
  }
  if (random.chance(0.35 + (1 - cat.affection) * 0.4)) {
    enterPhase(mind, 'groom', randomTimer(context, 1.2, 2.2))
    setEmote(cat, 'annoyed')
    return
  }
  enterPhase(mind, 'strut', randomTimer(context, 0.8, 1.4))
  mind.target = { x: cat.position.x + cat.facing * 60 * context.memory.sizeScale, y: cat.position.y + random.range(-20, 20) }
}

export const handledLandingBehavior: Behavior = {
  id: 'handledLanding',
  intent: 'wander',
  interruptible: false,
  ownsTimer: true,
  recencyPenalty: 0,
  minDuration: 3,
  maxDuration: 4,
  weight: () => 0,
  start(_cat, mind) {
    enterPhase(mind, 'land')
  },
  update(cat, mind, context) {
    if (mind.phase === 'land') {
      lockPose(mind, 'crouch', 0.16)
      setAction(cat, 'shakeOff')
      enterPhase(mind, 'shake', 0.75)
      return brake(cat, 6)
    }
    if (mind.phase === 'shake') {
      mind.idlePose = 'sit'
      if (phaseDone(mind)) chooseAftermath(cat, mind, context)
      return brake(cat)
    }
    if (mind.phase === 'groom') {
      mind.idlePose = 'groom'
      if (phaseDone(mind)) endBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phase === 'nuzzle') {
      const pointer = context.pointer.position
      gazeAt(cat, mind, pointer, 0.5)
      mind.idlePose = 'sit'
      if (phaseDone(mind) || !context.pointer.active) endBehavior(cat, mind, context)
      return arrive(cat, { x: pointer.x - cat.facing * 26, y: pointer.y + 18 }, topSpeed(cat, mind, context) * 0.35, 40)
    }
    mind.movePose = 'walk'
    if (phaseDone(mind) || !mind.target) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.4, 30)
  },
}
