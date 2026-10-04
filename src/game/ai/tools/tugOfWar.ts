import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { wandStringLength } from '../../tools/heldToy'
import { distance, dot, length, normalize, scale, subtract } from '../../vector'
import type { CatState } from '../../types'
import { faceToward, lockPose, setAction, setEmote } from '../helpers/pose'
import { mouthPoint, zeroVector } from '../helpers/queries'
import { endBehavior } from '../helpers/transitions'
import { chain } from './support/phases'
import { toolMemoryOf } from '../../tools/toolState'

const yankSpeed = 620

function releaseTug(cat: CatState, context: StepContext): void {
  const toy = context.world.heldToy
  if (!toy || toy.grabbedByCatId !== cat.id) return
  toy.grabbedByCatId = null
  toy.tugProgress = 0
  const memory = toolMemoryOf(context.world)
  memory.featherVelocity = { x: context.pointer.velocity.x * 0.4, y: -260 }
}

export const tugOfWarBehavior: Behavior = {
  id: 'tugOfWar',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 4,
  maxDuration: 6,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'tug'
    mind.movePose = 'tug'
    setEmote(cat, 'playful')
  },
  finish(cat, mind, context) {
    if (!mind.scratchNumbers.handoff) releaseTug(cat, context)
  },
  update(cat, mind, context) {
    const toy = context.world.heldToy
    if (!toy || toy.grabbedByCatId !== cat.id) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const cursor = context.pointer.position
    const mouth = mouthPoint(cat)
    const away = normalize(subtract(mouth, { x: cursor.x, y: cursor.y + toy.height }))
    faceToward(cat, mind, cursor, 0.5)
    mind.scratchPoints.gaze = { x: cursor.x, y: cursor.y }
    const yank = dot(context.pointer.velocity, scale(away, -1))
    const rope = wandStringLength(context)
    const stretch = distance(cursor, { x: mouth.x, y: mouth.y - toy.height })
    if (yank > yankSpeed) toy.tugProgress -= (yank / yankSpeed) * context.dt * 2.4
    else toy.tugProgress += context.dt * (0.3 + mind.personality.boldness * 0.2)
    if (!context.pointer.active || (stretch > rope * 2.6 && yank > yankSpeed * 0.8) || toy.tugProgress < -0.35) {
      releaseTug(cat, context)
      setAction(cat, 'missToy')
      lockPose(mind, 'flop', 0.7)
      setEmote(cat, 'annoyed')
      mind.scratchNumbers.handoff = 1
      endBehavior(cat, mind, context)
      return zeroVector
    }
    if (toy.tugProgress >= 1) {
      mind.scratchNumbers.handoff = 1
      chain(cat, mind, context, 'carryToyAway', 3.6)
      return zeroVector
    }
    const pull = stretch > rope * 1.3 ? scale(away, -36 * Math.min(2, stretch / rope - 1.3)) : scale(away, 42)
    return length(pull) > 0 ? pull : zeroVector
  },
}
