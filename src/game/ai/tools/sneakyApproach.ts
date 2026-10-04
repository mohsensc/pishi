import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { contestToy, contestTool } from './support/contest'
import { enterPhase, gazeAtToy, phaseDone } from './support/phases'
import { decideAfterMiss, handleToyLanding, launchToyLeap, releaseToyJump } from './support/toyLeap'

export const sneakyApproachBehavior: Behavior = {
  id: 'sneakyApproach',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 5,
  maxDuration: 7,
  weight: () => 0,
  start(cat, mind, context) {
    mind.movePose = 'stalk'
    mind.idlePose = 'stalk'
    mind.scratchNumbers.side = context.pointer.position.x > cat.position.x ? 1 : -1
    enterPhase(mind, 'circle')
    setEmote(cat, 'curious')
  },
  finish(cat, _mind, context) {
    releaseToyJump(cat, context)
  },
  update(cat, mind, context) {
    const tool = contestTool(context)
    if (mind.phase === 'airborne' && tool) {
      handleToyLanding(cat, mind, context, tool)
      return zeroVector
    }
    if (mind.phase === 'recover' && tool) {
      if (phaseDone(mind)) decideAfterMiss(cat, mind, context, tool)
      return brake(cat)
    }
    const toy = contestToy(context)
    if (!toy || !tool || mind.behaviorElapsed > 9) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    const side = mind.scratchNumbers.side ?? 1
    const flank = clampToBounds({ x: toy.position.x + side * 70 * context.memory.sizeScale, y: toy.position.y + 10 }, context.bounds)
    if (mind.phase === 'circle') {
      if (distance(cat.position, flank) < 14 || mind.phaseTimer > 4) enterPhase(mind, 'wiggle', 0.7)
      return arrive(cat, flank, topSpeed(cat, mind, context) * 0.2, 20)
    }
    if (mind.phase === 'wiggle') {
      mind.idlePose = 'stalk'
      if (!phaseDone(mind)) return brake(cat)
      if (!launchToyLeap(cat, mind, context, tool, 'pounceHigh')) {
        enterPhase(mind, 'wiggle', 0.4)
        return brake(cat)
      }
      enterPhase(mind, 'airborne')
    }
    return brake(cat)
  },
}
