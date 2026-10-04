import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { distance, pointToward } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { emergeFrom, hideIn } from '../helpers/hiding'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { inFrontOf } from '../helpers/propSpots'
import { bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { canHideMore, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { startleCat } from '../helpers/reactions'

function findPrey(cat: CatState, bush: PropState, context: StepContext): { point: Vec; victim: CatState | null } | null {
  const reach = (bush.radius + 150) * context.memory.sizeScale
  const victim = context.world.cats.find((other) => other.id !== cat.id && !other.hidden && other.height < 1 && distance(other.position, bush.position) < reach)
  if (victim) return { point: victim.position, victim }
  const butterfly = context.world.butterflies.find((candidate) => candidate.height < 70 && distance(candidate.position, bush.position) < reach)
  return butterfly ? { point: butterfly.position, victim: null } : null
}

export const bushAmbushBehavior: Behavior = {
  id: 'bushAmbush',
  intent: 'hide',
  interruptible: false,
  ownsTimer: true,
  minDuration: 9,
  maxDuration: 15,
  weight: (cat, mind, context) =>
    canHideMore(context) && hasProp(cat, context, ['bush'], 600, (bush) => bush.occupantIds.length === 0) ? 0.03 + mind.personality.zoominess * 0.1 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['bush'], 600, (bush) => bush.occupantIds.length === 0)?.id ?? null
    mind.movePose = 'stalk'
  },
  update(cat, mind, context) {
    const bush = findProp(context, mind.propTargetId)
    if (!bush) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      const velocity = travel(cat, mind, context, inFrontOf(bush, cat, context), 0.45)
      if (velocity) return velocity
      if (!canHideMore(context) || bush.occupantIds.length > 0) return quit(cat, mind, context)
      hideIn(cat, mind, bush, randomTimer(context, 6, 11), context)
      return zeroVector
    }
    if (mind.phase === 'inside') {
      const prey = mind.phaseTimer > 1.5 ? findPrey(cat, bush, context) : null
      if (!prey && mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return zeroVector
      emergeFrom(cat, bush, context)
      bumpAgitation(bush, 0.9)
      if (!prey) return quit(cat, mind, context)
      setEmote(cat, 'playful')
      if (prey.victim) startleCat(prey.victim, context, bush.position)
      const reach = Math.min(distance(cat.position, prey.point), 140 * context.memory.sizeScale)
      const landing = pointToward(cat.position, prey.point, reach)
      startLeap(cat, mind, context, landing, 0, 30 + 18 * mind.personality.jumpPower, 0.46, 'pounce', 'none')
      enterPhase(mind, 'landed', randomTimer(context, 0.6, 1.2))
      return zeroVector
    }
    if (mind.phase === 'landed') {
      mind.idlePose = 'crouch'
      return mind.phaseTimer > mind.holdDuration ? quit(cat, mind, context) : zeroVector
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
