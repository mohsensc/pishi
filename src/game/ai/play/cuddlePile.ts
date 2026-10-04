import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import type { CatState } from '../../types'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { faceToward, setEmote } from '../helpers/pose'
import { bodyLength, findCat, mindOf, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

function isResting(other: CatState, context: StepContext): boolean {
  if (other.hidden || other.height > 1 || Math.hypot(other.velocity.x, other.velocity.y) > 10) return false
  const pose = mindOf(other, context).idlePose
  return other.intent === 'napping' || pose === 'loaf' || pose === 'sleep'
}

function pickSnuggle(cat: CatState, context: StepContext): CatState | undefined {
  return context.world.cats.find((other) => other.id !== cat.id && isResting(other, context) && distance(other.position, cat.position) < sizeScaled(context, 420))
}

export const cuddlePileBehavior: Behavior = {
  id: 'cuddlePile',
  intent: 'socialize',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (cat, mind, context) => (pickSnuggle(cat, context) ? 0.2 + cat.affection * 0.25 + mind.personality.laziness * 0.15 : 0),
  start(cat, mind, context) {
    const buddy = pickSnuggle(cat, context)
    if (buddy) mind.scratchIds.buddy = buddy.id
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const buddy = findCat(context, mind.scratchIds.buddy ?? null)
    if (!buddy || buddy.hidden) return finishBehavior(cat, mind, context)
    if (mind.phase === 'snuggle') {
      mind.idlePose = mind.phaseTimer > 3 ? 'sleep' : 'loaf'
      if (phaseDone(mind) || distance(cat.position, buddy.position) > bodyLength(cat) * 1.6) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    const side = cat.position.x < buddy.position.x ? -1 : 1
    const spot = clampToBounds({ x: buddy.position.x + side * bodyLength(cat) * 0.72, y: buddy.position.y + 3 }, context.bounds)
    if (distance(cat.position, spot) < 7 || mind.phaseTimer > 7) {
      faceToward(cat, mind, buddy.position, 3)
      setEmote(cat, 'love')
      enterPhase(mind, 'snuggle', randomTimer(context, 5, 8))
      return zeroVector
    }
    return arrive(cat, spot, paceSpeed(cat, mind, context, 0.3), 20)
  },
}
