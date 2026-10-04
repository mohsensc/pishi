import type { Behavior } from '../../behavior'
import type { JumpTool } from '../../../tools/toolState'
import { distance } from '../../../vector'
import type { LeapStyle } from '../../../types'
import { hopInPlace } from '../../helpers/leap'
import { zeroVector } from '../../helpers/queries'
import { arrive, brake } from '../../helpers/steering'
import { topSpeed } from '../../helpers/threat'
import { endBehavior } from '../../helpers/transitions'
import { contestToy, spotUnderToy } from './contest'
import { chain, enterPhase, gazeAtToy, phaseDone } from './phases'
import { chooseLeapStyle } from './reach'
import { decideAfterMiss, handleToyLanding, launchToyLeap, releaseToyJump, windupFor } from './toyLeap'

const leapStyles = new Set<string>(['reach', 'springUp', 'twistReach', 'doubleHop', 'swat', 'pounceHigh'])

function isLeapStyle(value: string | undefined): value is LeapStyle {
  return value !== undefined && leapStyles.has(value)
}

export function createJumpBehavior(id: string, tool: JumpTool): Behavior {
  return {
    id,
    intent: 'play',
    interruptible: false,
    ownsTimer: true,
    minDuration: 3,
    maxDuration: 5,
    weight: () => 0,
    start(_cat, mind) {
      enterPhase(mind, 'approach')
    },
    finish(cat, _mind, context) {
      releaseToyJump(cat, context)
    },
    update(cat, mind, context) {
      const toy = contestToy(context)
      if (mind.phase === 'airborne') {
        handleToyLanding(cat, mind, context, tool)
        return zeroVector
      }
      if (mind.phase === 'recover') {
        if (phaseDone(mind)) decideAfterMiss(cat, mind, context, tool)
        return brake(cat)
      }
      if (!toy || toy.tool !== tool || mind.behaviorElapsed > 6) {
        endBehavior(cat, mind, context)
        return zeroVector
      }
      gazeAtToy(cat, mind, toy)
      const style: LeapStyle = isLeapStyle(mind.scratchIds.style) ? mind.scratchIds.style : chooseLeapStyle(cat, mind, context, false)
      mind.scratchIds.style = style
      const spot = spotUnderToy(cat, toy, context)
      if (mind.phase === 'approach') {
        if (distance(cat.position, spot) > 90 * context.memory.sizeScale) {
          chain(cat, mind, context, 'gatherAround')
          return zeroVector
        }
        if (distance(cat.position, spot) > 20 * cat.coat.scale && mind.phaseTimer < 1.2) return arrive(cat, spot, topSpeed(cat, mind, context) * 0.35, 20)
        const windup = windupFor(style)
        mind.idlePose = windup.pose
        cat.leapStyle = style
        enterPhase(mind, 'windup', windup.seconds)
        return brake(cat)
      }
      if (mind.phase === 'windup') {
        if (!phaseDone(mind)) return brake(cat, 6)
        if (style === 'doubleHop' && !mind.scratchNumbers.preHop) {
          mind.scratchNumbers.preHop = 1
          hopInPlace(cat, mind, context, 14 * cat.coat.scale, 0.24, 'hop')
          enterPhase(mind, 'windup', 0.04)
          return zeroVector
        }
        if (!launchToyLeap(cat, mind, context, tool, style)) {
          chain(cat, mind, context, 'beg')
          return zeroVector
        }
        enterPhase(mind, 'airborne')
        return zeroVector
      }
      return brake(cat)
    },
  }
}
