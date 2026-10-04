import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { distance, normalize, scale, subtract, add } from '../../vector'
import type { CatState } from '../../types'
import { enterPhase, finishBehavior, lateralWiggle, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { findCat, mindOf, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { isCasuallyAvailable } from './shared/partners'

function pickPrey(cat: CatState, context: StepContext): CatState | undefined {
  return context.world.cats.find((other) => {
    if (other.id === cat.id || other.hidden || other.height > 1) return false
    const gap = distance(other.position, cat.position)
    return gap > sizeScaled(context, 80) && gap < sizeScaled(context, 320) && !mindOf(other, context).leap
  })
}

export const pounceOnFriendBehavior: Behavior = {
  id: 'pounceOnFriend',
  intent: 'socialize',
  interruptible: true,
  minDuration: 7,
  maxDuration: 10,
  weight: (cat, mind, context) => (pickPrey(cat, context) ? 0.08 + mind.personality.boldness * 0.1 : 0),
  start(cat, mind, context) {
    const prey = pickPrey(cat, context)
    if (prey) mind.scratchIds.prey = prey.id
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    const prey = findCat(context, mind.scratchIds.prey ?? null)
    if (!prey || prey.hidden) return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = prey.position
    if (mind.phase === 'landed') {
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (mind.phase === 'wiggle') {
      if (!phaseDone(mind)) return add(brake(cat, 3), lateralWiggle(cat, 16, 3.4))
      const direction = normalize(subtract(prey.position, cat.position))
      const landing = subtract(prey.position, scale(direction, 20 * cat.coat.scale))
      startLeap(cat, mind, context, landing, 0, 28 * mind.personality.jumpPower + 8, 0.4, 'pounce', 'none')
      if (isCasuallyAvailable(prey, context)) {
        lockPose(mindOf(prey, context), 'arch', 0.5)
        setEmote(prey, context.memory.random.chance(0.5) ? 'annoyed' : 'startled')
      }
      setEmote(cat, 'playful')
      mind.idlePose = 'sit'
      enterPhase(mind, 'landed', 1.2)
      return zeroVector
    }
    if (distance(cat.position, prey.position) < sizeScaled(context, 95) || mind.phaseTimer > 6) {
      enterPhase(mind, 'wiggle', randomTimer(context, 0.5, 0.9))
      return zeroVector
    }
    return arrive(cat, prey.position, paceSpeed(cat, mind, context, 0.2), 20)
  },
}
