import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { canJoinToyAttention, contestIsFull, dropBallFor, contestToy, contestTool, isToyReady, spotUnderToy, toyInterest } from './support/contest'
import { toyHeightAbove } from './support/grab'
import { chain, gazeAtToy } from './support/phases'
import { standingReach } from './support/reach'
import { checkChance } from './support/toolQueries'
import { wantsTool } from '../../needs/toolNeeds'
import { requestEagerness } from '../../happiness/happiness'

const attractionRadius = 480

export const gatherAroundBehavior: Behavior = {
  id: 'gatherAround',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  recencyPenalty: 0,
  weight: () => 0,
  urgency(cat, mind, context) {
    const tool = contestTool(context)
    const eager = tool !== null && !cat.asleep && wantsTool(cat, tool)
    const toy = canJoinToyAttention(cat, mind, context, eager ? attractionRadius * 1.6 : attractionRadius)
    if (!tool || !toy) return 0
    if (eager) return checkChance(context, 3.6 * requestEagerness(cat)) ? 5.2 : 0
    if (contestIsFull(context, cat.id)) return 0
    return checkChance(context, toyInterest(cat, mind, tool)) ? 2.6 : 0
  },
  start(cat, mind, context) {
    dropBallFor(cat, mind, context)
    mind.behaviorUrgency = Math.max(mind.behaviorUrgency, 3.05)
    setEmote(cat, contestTool(context) === 'treat' ? 'curious' : 'playful')
  },
  update(cat, mind, context) {
    const toy = contestToy(context)
    if (!toy) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    if (!isToyReady(toy)) {
      mind.idlePose = 'sit'
      return brake(cat)
    }
    const spot = spotUnderToy(cat, toy, context)
    const gap = distance(cat.position, spot)
    if (gap < 14 * cat.coat.scale) {
      const low = toyHeightAbove(cat, toy) <= standingReach(cat) + 6
      const swatter = cat.coat.breed === 'persian' || cat.coat.breed === 'munchkin'
      if (low) chain(cat, mind, context, swatter && context.memory.random.chance(0.6) ? 'swatAtToy' : 'reachUp')
      else chain(cat, mind, context, 'beg')
      return zeroVector
    }
    if (contestIsFull(context, cat.id) && gap > 90 * context.memory.sizeScale) {
      chain(cat, mind, context, 'watchOthersJump', 2.2)
      return zeroVector
    }
    const eager = wantsTool(cat, contestTool(context) ?? 'hand')
    const pace = gap > 120 * context.memory.sizeScale ? (eager ? 0.9 : 0.62) : eager ? 0.5 : 0.36
    return arrive(cat, spot, topSpeed(cat, mind, context) * pace, 30)
  },
}
