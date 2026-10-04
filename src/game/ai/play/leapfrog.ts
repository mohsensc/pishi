import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { CatState } from '../../types'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { bodyLength, catRadius, findCat, isOpenGround, mindOf, zeroVector } from '../helpers/queries'
import { brake, seek } from '../helpers/steering'
import { isCasuallyAvailable } from './shared/partners'

function pickHurdle(cat: CatState, context: StepContext, excludeId: string | null): CatState | undefined {
  return context.world.cats.find((other) => {
    if (other.id === cat.id || other.id === excludeId || other.hidden || other.height > 1) return false
    if (Math.hypot(other.velocity.x, other.velocity.y) > 40) return false
    const gap = distance(other.position, cat.position)
    return gap > sizeScaled(context, 70) && gap < sizeScaled(context, 300) && !mindOf(other, context).leap
  })
}

export const leapfrogBehavior: Behavior = {
  id: 'leapfrog',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind, context) => (pickHurdle(cat, context, null) ? 0.07 + mind.personality.jumpPower * 0.07 : 0),
  start(cat, mind, context) {
    const hurdle = pickHurdle(cat, context, null)
    if (hurdle) mind.scratchIds.hurdle = hurdle.id
    mind.idlePose = 'sit'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    if (mind.phase === 'landed') {
      if (!phaseDone(mind)) return brake(cat)
      const next = mind.attempts < 2 ? pickHurdle(cat, context, mind.scratchIds.hurdle ?? null) : undefined
      if (!next) {
        setEmote(cat, 'proud')
        return finishBehavior(cat, mind, context)
      }
      mind.scratchIds.hurdle = next.id
      enterPhase(mind, 'start')
    }
    const hurdle = findCat(context, mind.scratchIds.hurdle ?? null)
    if (!hurdle || hurdle.hidden || hurdle.height > 1 || mind.phaseTimer > 5) return finishBehavior(cat, mind, context)
    const direction = normalize(subtract(hurdle.position, cat.position))
    const gap = distance(cat.position, hurdle.position)
    if (gap < bodyLength(cat) * 1.3) {
      let landing = add(hurdle.position, scale(direction, bodyLength(cat) * 1.3))
      if (!isOpenGround(landing, context, catRadius(cat))) landing = add(hurdle.position, scale(direction, bodyLength(cat) * 0.9))
      startLeap(cat, mind, context, landing, 0, 36 + 12 * mind.personality.jumpPower, 0.46, 'jump', 'none')
      if (isCasuallyAvailable(hurdle, context)) lockPose(mindOf(hurdle, context), 'crouch', 0.6)
      mind.attempts += 1
      enterPhase(mind, 'landed', 0.7)
      return zeroVector
    }
    return seek(cat, hurdle.position, paceSpeed(cat, mind, context, 0.75))
  },
}
