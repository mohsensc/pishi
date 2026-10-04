import type { Behavior } from '../behavior'
import { clamp, distance, lerp, scale, subtract } from '../../vector'
import type { Vec } from '../../types'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { enterPhase, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { catRadius, findProp, settleOnGround, zeroVector } from '../helpers/queries'
import { topSpeed } from '../helpers/threat'

export const benchWeaveBehavior: Behavior = {
  id: 'benchWeave',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 7,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasProp(cat, context, ['bench'], 600, (bench) => bench.occupantIds.length === 0) ? 0.04 + mind.personality.zoominess * 0.06 : 0),
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['bench'], 600, (bench) => bench.occupantIds.length === 0)?.id ?? null
    mind.scratchNumbers.passes = context.memory.random.integer(1, 3)
    mind.scratchNumbers.side = context.memory.random.sign()
  },
  update(cat, mind, context) {
    const bench = findProp(context, mind.propTargetId)
    if (!bench) return quit(cat, mind, context)
    const side = mind.scratchNumbers.side ?? 1
    const reach = bench.radius + catRadius(cat) + 3
    const entry: Vec = { x: bench.position.x - side * reach, y: bench.position.y + 2 }
    const exit: Vec = { x: bench.position.x + side * reach, y: bench.position.y + 2 }
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      const velocity = travel(cat, mind, context, entry, 0.45, 12)
      if (velocity) return velocity
      setEmote(cat, 'playful')
      cat.height = 1.5
      mind.movePose = 'stalk'
      mind.scratchNumbers.progress = 0
      enterPhase(mind, 'weave')
      return zeroVector
    }
    const span = Math.max(1, distance(entry, exit))
    const progress = clamp((mind.scratchNumbers.progress ?? 0) + (topSpeed(cat, mind, context) * 0.3 * context.dt) / span, 0, 1)
    mind.scratchNumbers.progress = progress
    const previous = cat.position
    const next = { x: lerp(entry.x, exit.x, progress), y: bench.position.y + 2 + Math.sin(progress * Math.PI * 4) * bench.radius * 0.32 }
    cat.position = next
    cat.velocity = scale(subtract(next, previous), 1 / Math.max(1e-3, context.dt))
    if (progress < 1 && !isOvertime(cat)) return zeroVector
    const passes = (mind.scratchNumbers.passes ?? 1) - 1
    mind.scratchNumbers.passes = passes
    if (passes > 0 && !isOvertime(cat)) {
      mind.scratchNumbers.side = -side
      mind.scratchNumbers.progress = 0
      return zeroVector
    }
    cat.height = 0
    cat.position = settleOnGround(exit, context, catRadius(cat))
    return quit(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
    if (cat.height > 0 && cat.height < 3 && !cat.hidden && !mind.leap) {
      const clear = settleOnGround(cat.position, context, catRadius(cat))
      cat.height = 0
      if (distance(clear, cat.position) > 6) startLeap(cat, mind, context, clear, 0, 6, 0.26, 'run', 'none')
      else cat.position = clear
    }
  },
}
