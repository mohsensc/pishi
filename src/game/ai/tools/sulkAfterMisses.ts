import type { Behavior } from '../behavior'
import { add, normalize, scale, subtract } from '../../vector'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { clearMisses, coolDownTools } from '../../tools/toolState'

export const sulkAfterMissesBehavior: Behavior = {
  id: 'sulkAfterMisses',
  intent: 'wander',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: () => 0,
  start(cat, mind, context) {
    setEmote(cat, 'annoyed')
    clearMisses(context.world, cat.id)
    coolDownTools(context.world, cat.id, 12)
    mind.movePose = 'walk'
    const away = normalize(subtract(cat.position, context.pointer.position))
    mind.target = randomOpenPoint(context, add(cat.position, scale(away, 80 * context.memory.sizeScale)), 30, 20)
  },
  update(cat, mind, context) {
    const arrived = !mind.target || Math.hypot(cat.position.x - mind.target.x, cat.position.y - mind.target.y) < 10
    if (!arrived && mind.target) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.3, 20)
    const awayFacing: 1 | -1 = context.pointer.position.x > cat.position.x ? -1 : 1
    cat.facing = awayFacing
    mind.facingHold = 0.5
    mind.scratchPoints.gaze = { x: cat.position.x + awayFacing * 80, y: cat.position.y - 10 }
    mind.idlePose = mind.phaseTimer % 3 < 1.2 ? 'groom' : 'loaf'
    return brake(cat)
  },
}
