import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import type { CatState, Vec } from '../../types'
import { distance } from '../../vector'
import { setAction, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, orbit } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { cursorGround, pointerSpeed } from './support/cursorGround'
import { every, gazeAt } from './support/phases'

const behaviorId = 'rubAgainstCursor'
const maxRubbers = 4

function rubbersAround(context: StepContext): CatState[] {
  return context.world.cats.filter((other) => other.behavior === behaviorId && !other.hidden).sort((first, second) => (first.id < second.id ? -1 : 1))
}

function rubSlot(cat: CatState, rubbers: CatState[], center: Vec, context: StepContext): Vec {
  const index = Math.max(0, rubbers.findIndex((other) => other.id === cat.id))
  const count = rubbers.length
  const angle = (Math.PI * 2 * index) / count + context.world.time * 0.22
  const weave = Math.sin(context.world.time * 1.9 + index * 1.7) * 0.18
  const radiusX = Math.max(34, count * 24) * cat.coat.scale
  return { x: center.x + Math.cos(angle + weave) * radiusX, y: center.y + Math.sin(angle + weave) * radiusX * 0.42 }
}

export const rubAgainstCursorBehavior: Behavior = {
  id: behaviorId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight(cat, _mind, context) {
    if (context.pointer.tool !== 'hand' || !context.pointer.active || cat.affection < 0.45) return 0
    if (cat.behavior !== behaviorId && rubbersAround(context).length >= maxRubbers) return 0
    return distance(cat.position, context.pointer.position) < 380 * context.memory.sizeScale ? cat.affection * 0.6 : 0
  },
  start(cat, mind, context) {
    setEmote(cat, 'love')
    mind.movePose = 'walk'
    mind.scratchNumbers.direction = context.memory.random.sign()
  },
  update(cat, mind, context) {
    if (!context.pointer.active || context.pointer.tool !== 'hand' || pointerSpeed(context) > 520) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const center = cursorGround(cat, context)
    gazeAt(cat, mind, context.pointer.position, 0.2)
    const speed = topSpeed(cat, mind, context)
    const rubbers = rubbersAround(context)
    const crowded = rubbers.length > 1
    const approachRadius = (crowded ? Math.max(34, rubbers.length * 24) + 46 : 70) * cat.coat.scale
    if (distance(cat.position, center) > approachRadius) return arrive(cat, crowded ? rubSlot(cat, rubbers, center, context) : center, speed * 0.45, 30)
    if (every(mind, context, 'weave', 1.2)) mind.scratchNumbers.direction = -(mind.scratchNumbers.direction ?? 1)
    if (every(mind, context, 'purr', 1.6)) setAction(cat, 'purr')
    if (crowded) return arrive(cat, rubSlot(cat, rubbers, center, context), speed * 0.4, 26)
    const direction: 1 | -1 = (mind.scratchNumbers.direction ?? 1) > 0 ? 1 : -1
    return orbit(cat, center, 24 * cat.coat.scale, speed * 0.26, direction)
  },
}
