import type { Behavior } from '../behavior'
import { add, normalize, scale, subtract } from '../../vector'
import { lockPose, setEmote } from '../helpers/pose'
import { randomOpenPoint, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { coolDownTools, toolMemoryOf } from '../../tools/toolState'

export const carryToyAwayBehavior: Behavior = {
  id: 'carryToyAway',
  intent: 'play',
  interruptible: false,
  minDuration: 1.8,
  maxDuration: 3,
  weight: () => 0,
  start(cat, mind, context) {
    setEmote(cat, 'proud')
    mind.movePose = 'walk'
    const away = normalize(subtract(cat.position, context.pointer.position))
    mind.target = randomOpenPoint(context, add(cat.position, scale(away, 150 * context.memory.sizeScale)), 40, 20)
  },
  finish(cat, _mind, context) {
    const toy = context.world.heldToy
    if (!toy || toy.grabbedByCatId !== cat.id) return
    toy.grabbedByCatId = null
    toy.tugProgress = 0
    toolMemoryOf(context.world).featherVelocity = { x: 0, y: -200 }
    coolDownTools(context.world, cat.id, 6)
  },
  update(cat, mind, context) {
    const toy = context.world.heldToy
    if (!toy || toy.grabbedByCatId !== cat.id) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    toy.tugProgress = 1
    if (cat.intentTimer <= 0.35 && !mind.scratchNumbers.dropped) {
      mind.scratchNumbers.dropped = 1
      lockPose(mind, 'bat', 0.3)
    }
    return mind.target ? arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.5, 30) : zeroVector
  },
}
