import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { clampToBounds } from '../../bounds'
import { add, distance, normalize, pointToward, scale, subtract } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { catRadius, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake, seek } from '../helpers/steering'

function coverProp(cat: CatState, context: StepContext): PropState | undefined {
  const reach = sizeScaled(context, 300)
  return context.world.props
    .filter((prop) => prop.solid && prop.kind !== 'pond' && !prop.tunnelExit && distance(prop.position, cat.position) < reach)
    .sort((first, second) => distance(first.position, cat.position) - distance(second.position, cat.position))[0]
}

function preyPoint(cat: CatState, mind: CatMind, context: StepContext): Vec {
  if (context.pointer.active) return context.pointer.position
  const prey = context.world.cats.find((other) => other.id === mind.scratchIds.prey)
  return prey ? prey.position : add(cat.position, { x: cat.facing * 200, y: 0 })
}

function hidingSpot(cat: CatState, prop: PropState, prey: Vec, context: StepContext): Vec {
  const away = normalize(subtract(prop.position, prey))
  const direction = away.x === 0 && away.y === 0 ? { x: 1, y: 0 } : away
  return clampToBounds(add(prop.position, scale(direction, prop.radius + catRadius(cat) + 6)), context.bounds)
}

export const ambushBehavior: Behavior = {
  id: 'ambush',
  intent: 'play',
  interruptible: true,
  minDuration: 10,
  maxDuration: 14,
  weight: (cat, mind, context) => (coverProp(cat, context) ? 0.06 + mind.personality.boldness * 0.12 : 0),
  start(cat, mind, context) {
    const prop = coverProp(cat, context)
    if (prop) mind.scratchIds.cover = prop.id
    const prey = context.world.cats.find((other) => other.id !== cat.id && !other.hidden)
    if (prey) mind.scratchIds.prey = prey.id
    mind.movePose = 'stalk'
    mind.idlePose = 'peek'
  },
  update(cat, mind, context) {
    const prop = findProp(context, mind.scratchIds.cover ?? null)
    if (!prop) return finishBehavior(cat, mind, context)
    const prey = preyPoint(cat, mind, context)
    if (mind.phase === 'dash') {
      const gap = distance(cat.position, prey)
      const stopShort = sizeScaled(context, context.pointer.active ? 90 : 40)
      if (gap < stopShort + sizeScaled(context, 50) || phaseDone(mind)) {
        startLeap(cat, mind, context, pointToward(cat.position, prey, Math.max(0, Math.min(gap - stopShort, sizeScaled(context, 60)))), 0, 26, 0.34, 'pounce', 'none')
        setEmote(cat, 'playful')
        mind.idlePose = 'sit'
        enterPhase(mind, 'done', 1)
        return zeroVector
      }
      return seek(cat, prey, paceSpeed(cat, mind, context, 1))
    }
    if (mind.phase === 'done') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phase === 'peek') {
      mind.scratchPoints.gaze = prey
      if (phaseDone(mind)) enterPhase(mind, 'dash', 1.6)
      return brake(cat)
    }
    const spot = hidingSpot(cat, prop, prey, context)
    if (distance(cat.position, spot) < sizeScaled(context, 10) || mind.phaseTimer > 6) {
      setEmote(cat, 'curious')
      enterPhase(mind, 'peek', randomTimer(context, 1.6, 3))
      return zeroVector
    }
    return arrive(cat, spot, paceSpeed(cat, mind, context, 0.42), 20)
  },
}
