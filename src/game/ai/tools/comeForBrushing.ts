import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { cursorOnBody } from './support/cursorGround'
import { dropBallFor } from './support/contest'
import { chain, commit, gazeAtToy } from './support/phases'
import { activeHeldToy, brushIds, checkChance, countDoing, isFreeForTools } from './support/toolQueries'
import { wantsTool } from '../../needs/toolNeeds'
import { requestEagerness } from '../../happiness/happiness'

export const comeForBrushingBehavior: Behavior = {
  id: 'comeForBrushing',
  intent: 'socialize',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: () => 0,
  urgency(cat, mind, context) {
    const brush = activeHeldToy(context, 'brush')
    if (!brush || brushIds.has(cat.behavior)) return 0
    const eager = wantsTool(cat, 'brush') && !cat.asleep
    if (!isFreeForTools(cat, mind, context, eager)) return 0
    if (eager) return checkChance(context, 3.6 * requestEagerness(cat)) ? 5.2 : 0
    const fan = cat.coat.breed === 'persian' || cat.affection > 0.26
    if (!fan || distance(cat.position, brush.position) > 380 * context.memory.sizeScale) return 0
    if (countDoing(context, new Set(['comeForBrushing', 'getBrushed']), cat.id) >= 2) return 0
    return checkChance(context, 0.25 + cat.affection * 0.9) ? 2.2 : 0
  },
  start(cat, mind, context) {
    commit(mind)
    setEmote(cat, 'love')
    const eager = wantsTool(cat, 'brush')
    if (eager) dropBallFor(cat, mind, context)
    mind.movePose = eager ? 'run' : 'walk'
    mind.scratchNumbers.eager = eager ? 1 : 0
  },
  update(cat, mind, context) {
    const brush = activeHeldToy(context, 'brush')
    if (!brush) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAtToy(cat, mind, brush)
    if (cursorOnBody(cat, context, 44)) {
      chain(cat, mind, context, 'getBrushed', 3.2)
      return zeroVector
    }
    const spot = { x: brush.position.x - cat.facing * 6, y: brush.position.y }
    if (distance(cat.position, spot) < 16) {
      mind.idlePose = 'sit'
      return brake(cat)
    }
    return arrive(cat, spot, topSpeed(cat, mind, context) * (mind.scratchNumbers.eager ? 0.8 : 0.38), 30)
  },
}
