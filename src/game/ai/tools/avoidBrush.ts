import type { Behavior } from '../behavior'
import { add, distance, normalize, scale, subtract } from '../../vector'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { archAway } from '../helpers/reactions'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { activeHeldToy, brushIds, checkChance, isFreeForTools } from './support/toolQueries'

export const avoidBrushBehavior: Behavior = {
  id: 'avoidBrush',
  intent: 'wander',
  interruptible: true,
  minDuration: 2,
  maxDuration: 3,
  weight: () => 0,
  urgency(cat, mind, context) {
    const brush = activeHeldToy(context, 'brush')
    if (!brush || brushIds.has(cat.behavior) || !isFreeForTools(cat, mind, context)) return 0
    if (cat.coat.breed === 'persian' || cat.affection > 0.24) return 0
    if (distance(cat.position, brush.position) > 90 * context.memory.sizeScale) return 0
    return checkChance(context, 1.2) ? 2.1 : 0
  },
  start(cat, mind, context) {
    archAway(cat, mind, context.pointer.position, 0.5, 90)
    setEmote(cat, 'annoyed')
    mind.movePose = 'walk'
    const away = normalize(subtract(cat.position, context.pointer.position))
    mind.target = randomOpenPoint(context, add(cat.position, scale(away, 150 * context.memory.sizeScale)), 30, 20)
  },
  update(cat, mind, context) {
    if (!mind.target) return zeroVector
    return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.45, 30)
  },
}
