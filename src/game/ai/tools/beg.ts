import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { contestToy, contestTool, isToyReady, spotUnderToy } from './support/contest'
import { toyHeightAbove } from './support/grab'
import { chain, enterPhase, every, gazeAtToy, phaseDone } from './support/phases'
import { chooseLeapStyle, reachableHeight, standingReach } from './support/reach'

function eagerness(breed: string, boldness: number): number {
  if (breed === 'persian') return 0.28
  if (breed === 'munchkin') return 0.7
  return 0.72 + boldness * 0.25
}

export const begBehavior: Behavior = {
  id: 'beg',
  intent: 'play',
  interruptible: true,
  ownsTimer: true,
  minDuration: 6,
  maxDuration: 10,
  weight: () => 0,
  start(cat, mind, context) {
    mind.idlePose = 'beg'
    mind.movePose = 'walk'
    enterPhase(mind, 'beg', context.memory.random.range(0.7, 1.8) * (cat.coat.breed === 'persian' ? 1.6 : 1))
  },
  update(cat, mind, context) {
    const toy = contestToy(context)
    const tool = contestTool(context)
    if (!toy || !tool || mind.behaviorElapsed > 14) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, toy)
    mind.idlePose = 'beg'
    if (every(mind, context, 'emote', 2.6)) setEmote(cat, tool === 'treat' ? 'love' : 'playful')
    const spot = spotUnderToy(cat, toy, context)
    const gap = distance(cat.position, spot)
    if (gap > 60 * context.memory.sizeScale) {
      chain(cat, mind, context, 'gatherAround')
      return zeroVector
    }
    const shuffle = gap > 8 ? arrive(cat, spot, topSpeed(cat, mind, context) * 0.3, 20) : brake(cat)
    if (!isToyReady(toy) || !phaseDone(mind)) return shuffle
    if (toyHeightAbove(cat, toy) <= standingReach(cat) + 6) {
      chain(cat, mind, context, 'reachUp')
      return zeroVector
    }
    const style = chooseLeapStyle(cat, mind, context, false)
    const tooHigh = toyHeightAbove(cat, toy) > reachableHeight(cat, mind, style) * 1.12
    const willing = context.memory.random.chance(tooHigh ? 0.2 : eagerness(cat.coat.breed, mind.personality.boldness))
    if (!willing) {
      enterPhase(mind, 'beg', context.memory.random.range(0.8, 1.6))
      if (tooHigh && context.memory.random.chance(0.3)) setEmote(cat, 'curious')
      return shuffle
    }
    chain(cat, mind, context, tool === 'treat' ? 'jumpForTreat' : 'jumpForToy')
    mind.scratchIds.style = style
    return zeroVector
  },
}
