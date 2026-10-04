import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { faceToward } from '../helpers/pose'
import { brake } from '../helpers/steering'

const watchRadius = 260

export const watchHeldToyBehavior: Behavior = {
  id: 'watchHeldToy',
  intent: 'play',
  interruptible: true,
  minDuration: 1.5,
  maxDuration: 3,
  weight: () => 0,
  urgency(cat, mind, context) {
    const toy = context.world.heldToy
    if (!toy || cat.heldBallId || cat.hidden || cat.height > 1) return 0
    if (toy.tool !== 'brush' && toy.tool !== 'catnip') return 0
    if (cat.behavior === 'comeForBrushing' || cat.behavior === 'getBrushed') return 0
    if (distance(toy.position, cat.position) > watchRadius * context.memory.sizeScale) return 0
    return context.memory.random.chance(mind.personality.curiosity * 0.3) ? 2 : 0
  },
  start(_cat, mind) {
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const toy = context.world.heldToy
    if (toy) {
      mind.scratchPoints.gaze = { x: toy.position.x, y: toy.position.y - toy.height }
      faceToward(cat, mind, toy.position, 0.3)
    }
    return brake(cat)
  },
}
