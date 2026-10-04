import type { Behavior } from '../../behavior'
import type { StepContext } from '../../../memory'

export const farBallShield = 1
const commitShield = 3
const commitSeconds = 3.5
const playWeightScale = 2.2
const socialWeightScale = 3.2

function toolsInPlay(context: StepContext): boolean {
  const { world, pointer } = context
  return pointer.tool !== 'hand' || world.heldToy !== null || world.treats.length > 0 || world.catnip.length > 0
}

export function shieldFromFarBalls(behavior: Behavior): Behavior {
  return {
    ...behavior,
    weight: (cat, mind, context) => {
      if (cat.hidden || cat.height > 1 || mind.perch) return 0
      return behavior.weight(cat, mind, context) * playWeightScale * (behavior.intent === 'socialize' ? socialWeightScale : 1)
    },
    start(cat, mind, context) {
      behavior.start(cat, mind, context)
      if (mind.behaviorUrgency >= commitShield || toolsInPlay(context)) {
        mind.behaviorUrgency = Math.max(mind.behaviorUrgency, farBallShield)
        return
      }
      mind.behaviorUrgency = commitShield
      mind.scratchNumbers.commitShield = 1
    },
    update(cat, mind, context) {
      if (mind.scratchNumbers.commitShield === 1 && (mind.behaviorElapsed > commitSeconds || toolsInPlay(context))) {
        mind.scratchNumbers.commitShield = 0
        mind.behaviorUrgency = Math.min(mind.behaviorUrgency, farBallShield)
      }
      return behavior.update(cat, mind, context)
    },
    finish(cat, mind, context) {
      behavior.finish?.(cat, mind, context)
      mind.idlePose = 'sit'
    },
  }
}
