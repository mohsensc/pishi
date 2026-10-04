import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { faceToward, setEmote } from '../helpers/pose'
import { bailIfThreatened, commit, enterPhase, hasProp, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { catRadius, findCat, findProp, randomTimer, settleOnGround, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

function watchedPoint(context: StepContext, watchedId: string | undefined): Vec | null {
  if (context.pointer.active) return context.pointer.position
  const watched = findCat(context, watchedId ?? null)
  return watched && !watched.hidden ? watched.position : null
}

function hidingSpot(tree: PropState, cat: CatState, context: StepContext, from: Vec, swing: number): Vec {
  const away = normalize(subtract(tree.position, from))
  const angle = Math.atan2(away.y, away.x) + swing
  const reach = tree.radius + catRadius(cat) + 3
  return settleOnGround(add(tree.position, scale({ x: Math.cos(angle), y: Math.sin(angle) * 0.6 }, reach)), context, catRadius(cat))
}

export const trunkPeekBehavior: Behavior = {
  id: 'trunkPeek',
  intent: 'hide',
  interruptible: false,
  minDuration: 7,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasProp(cat, context, ['tree'], 520) ? 0.04 + mind.personality.curiosity * 0.06 : 0),
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['tree'], 520)?.id ?? null
    const others = context.world.cats.filter((other) => other.id !== cat.id && !other.hidden)
    if (others.length > 0) mind.scratchIds.watched = context.memory.random.pick(others).id
    mind.movePose = 'stalk'
  },
  update(cat, mind, context) {
    const tree = findProp(context, mind.propTargetId)
    const watched = watchedPoint(context, mind.scratchIds.watched)
    if (!tree || !watched) return quit(cat, mind, context)
    if (bailIfThreatened(cat, mind, context, 0.45)) return zeroVector
    if (mind.phase === 'start') {
      enterPhase(mind, 'go')
      mind.scratchNumbers.swing = 0
    }
    const spot = hidingSpot(tree, cat, context, watched, mind.scratchNumbers.swing ?? 0)
    if (mind.phase === 'go') {
      const velocity = travel(cat, mind, context, spot, 0.5, 10)
      if (velocity) return velocity
      enterPhase(mind, 'peek', randomTimer(context, 1.4, 2.6))
      setEmote(cat, 'curious')
      commit(mind)
    }
    if (distance(cat.position, spot) > 24 * cat.coat.scale) return travel(cat, mind, context, spot, 0.28, 4) ?? brake(cat)
    mind.idlePose = 'peek'
    mind.scratchPoints.gaze = watched
    faceToward(cat, mind, watched, 0.4)
    if (mind.phaseTimer > mind.holdDuration) {
      const swing = mind.scratchNumbers.swing ?? 0
      mind.scratchNumbers.swing = swing > 0 ? -0.9 : 0.9
      enterPhase(mind, 'peek', randomTimer(context, 1.4, 2.6))
    }
    if (cat.intentTimer <= 0) return quit(cat, mind, context)
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
