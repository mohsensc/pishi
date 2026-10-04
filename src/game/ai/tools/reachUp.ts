import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { contestToy, contestTool, isToyReady, spotUnderToy } from './support/contest'
import { attemptGrab, registerMissOf, toyHeightAbove } from './support/grab'
import { chain, gazeAtToy } from './support/phases'
import { bodyTop, standingReach } from './support/reach'

export const reachUpBehavior: Behavior = {
  id: 'reachUp',
  intent: 'play',
  interruptible: true,
  ownsTimer: true,
  minDuration: 2,
  maxDuration: 3,
  weight: () => 0,
  start(_cat, mind) {
    mind.idlePose = 'reach'
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    const toy = contestToy(context)
    const tool = contestTool(context)
    if (!toy || !tool) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    mind.idlePose = 'reach'
    const spot = spotUnderToy(cat, toy, context)
    if (distance(cat.position, spot) > 60 * context.memory.sizeScale) {
      chain(cat, mind, context, 'gatherAround')
      return zeroVector
    }
    if (isToyReady(toy) && toyHeightAbove(cat, toy) > standingReach(cat) + 24 * cat.coat.scale) {
      chain(cat, mind, context, 'beg')
      return zeroVector
    }
    if (mind.phaseTimer > 0.35 && attemptGrab(cat, tool, context, standingReach(cat) + 8 * cat.coat.scale, bodyTop(cat) * 0.3)) {
      chain(cat, mind, context, tool === 'treat' ? 'munchTreat' : 'tugOfWar', tool === 'treat' ? 3.1 : 3.6)
      return zeroVector
    }
    if (mind.behaviorElapsed > 2.6) {
      registerMissOf(cat, tool, context)
      chain(cat, mind, context, 'beg')
      return zeroVector
    }
    return distance(cat.position, spot) > 6 ? arrive(cat, spot, topSpeed(cat, mind, context) * 0.25, 16) : brake(cat)
  },
}
