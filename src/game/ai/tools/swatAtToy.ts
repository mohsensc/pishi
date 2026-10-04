import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { lockPose, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { contestToy, contestTool, isToyReady, spotUnderToy } from './support/contest'
import { attemptGrab, registerMissOf, toyHeightAbove } from './support/grab'
import { chain, gazeAtToy } from './support/phases'
import { pawReach, standingReach } from './support/reach'

export const swatAtToyBehavior: Behavior = {
  id: 'swatAtToy',
  intent: 'play',
  interruptible: true,
  ownsTimer: true,
  minDuration: 3,
  maxDuration: 4,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'reach'
    mind.scratchNumbers.swats = 0
    cat.leapStyle = 'swat'
  },
  finish(cat) {
    cat.leapStyle = null
  },
  update(cat, mind, context) {
    const toy = contestToy(context)
    const tool = contestTool(context)
    if (!toy || !tool) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    const spot = spotUnderToy(cat, toy, context)
    if (distance(cat.position, spot) > 70 * context.memory.sizeScale) {
      chain(cat, mind, context, 'gatherAround')
      return zeroVector
    }
    if (isToyReady(toy) && toyHeightAbove(cat, toy) > standingReach(cat) + 34 * cat.coat.scale) {
      chain(cat, mind, context, 'beg')
      return zeroVector
    }
    if (mind.phaseTimer > 0.5 && isToyReady(toy)) {
      mind.phaseTimer = context.memory.random.range(-0.15, 0.1)
      mind.scratchNumbers.swats = (mind.scratchNumbers.swats ?? 0) + 1
      lockPose(mind, 'bat', 0.28)
      if (attemptGrab(cat, tool, context, standingReach(cat) + pawReach(cat, 'swat'), 0)) {
        chain(cat, mind, context, tool === 'treat' ? 'munchTreat' : 'tugOfWar', tool === 'treat' ? 3.1 : 3.6)
        return zeroVector
      }
      if (mind.scratchNumbers.swats >= context.memory.random.integer(4, 6)) {
        registerMissOf(cat, tool, context)
        setEmote(cat, 'annoyed')
        chain(cat, mind, context, 'beg')
        return zeroVector
      }
    }
    mind.idlePose = 'reach'
    return distance(cat.position, spot) > 6 ? arrive(cat, spot, topSpeed(cat, mind, context) * 0.3, 16) : brake(cat)
  },
}
