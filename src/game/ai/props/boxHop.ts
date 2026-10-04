import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState, PropState } from '../../types'
import { boxFront } from '../helpers/hiding'
import { perchSpotFor } from '../helpers/perch'
import { setEmote } from '../helpers/pose'
import { holdSpot, hopToGround, inFrontOf, mountSpot, spotFree } from '../helpers/propSpots'
import { bailIfThreatened, candidateProps, enterPhase, finishUse, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

function topFree(box: PropState, cat: CatState, context: StepContext): boolean {
  const spot = perchSpotFor(box, 0, context.world.height)
  if (!spot) return false
  return box.occupantIds.every((id) => id === cat.id) && spotFree(context, spot, cat.id)
}

function nextBox(cat: CatState, current: PropState, context: StepContext): PropState | undefined {
  const reach = 380 * context.memory.sizeScale
  const options = context.world.props.filter((box) => box.kind === 'cardboardBox' && box.id !== current.id && distance(box.position, current.position) < reach && topFree(box, cat, context))
  return options.length > 0 ? context.memory.random.pick(options) : undefined
}

export const boxHopBehavior: Behavior = {
  id: 'boxHop',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 8,
  maxDuration: 14,
  weight(cat, mind, context) {
    if (cat.height > 1) return 0
    const boxes = candidateProps(cat, context, ['cardboardBox'], 650, (box) => topFree(box, cat, context))
    return boxes.length >= 2 ? 0.04 + mind.personality.jumpPower * 0.06 : 0
  },
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['cardboardBox'], 650, (box) => topFree(box, cat, context))?.id ?? null
    mind.scratchNumbers.hops = context.memory.random.integer(2, 4)
  },
  update(cat, mind, context) {
    const box = findProp(context, mind.propTargetId)
    if (!box) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      if (bailIfThreatened(cat, mind, context)) return zeroVector
      const velocity = travel(cat, mind, context, inFrontOf(box, cat, context), 0.6, 16)
      if (velocity) return velocity
      const spot = perchSpotFor(box, 0, context.world.height)
      if (!spot || !topFree(box, cat, context)) return quit(cat, mind, context)
      mountSpot(cat, mind, context, spot, 'jump')
      setEmote(cat, 'playful')
      enterPhase(mind, 'top', randomTimer(context, 0.6, 1.4))
      return zeroVector
    }
    if (!holdSpot(cat, mind)) return finishUse(cat, mind, context)
    mind.idlePose = 'crouch'
    if (bailIfThreatened(cat, mind, context, 0.6)) return zeroVector
    if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return brake(cat)
    const hops = (mind.scratchNumbers.hops ?? 0) - 1
    mind.scratchNumbers.hops = hops
    const target = hops > 0 && !isOvertime(cat) ? nextBox(cat, box, context) : undefined
    const spot = target ? perchSpotFor(target, 0, context.world.height) : null
    if (target && spot) {
      mind.propTargetId = target.id
      mountSpot(cat, mind, context, spot, 'pounce', 36)
      enterPhase(mind, 'top', randomTimer(context, 0.5, 1.2))
      return zeroVector
    }
    hopToGround(cat, mind, context, boxFront(box, cat))
    return zeroVector
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
