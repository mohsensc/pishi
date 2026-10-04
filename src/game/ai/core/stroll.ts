import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import type { Vec } from '../../types'
import { distance } from '../../vector'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { nearbyPathCell, nextPathCell } from '../helpers/pathWalk'
import { pathCellCenter } from '../../landscape/pathGrid'

const promenadeChance = 0.55

function cellPoint(context: StepContext, cell: number): Vec {
  const center = pathCellCenter(context.world.width, context.world.height, cell)
  const random = context.memory.random
  return { x: center.x + random.range(-6, 6), y: center.y + random.range(-4, 4) }
}

export const strollBehavior: Behavior = {
  id: 'stroll',
  intent: 'wander',
  interruptible: true,
  minDuration: 3,
  maxDuration: 9,
  weight: () => 0.5,
  start(cat, mind, context) {
    const cell = context.memory.random.chance(promenadeChance) ? nearbyPathCell(context, cat.position, 300 * context.memory.sizeScale) : null
    if (cell !== null) {
      mind.phase = 'promenade'
      mind.scratchNumbers.pathCell = cell
      mind.scratchNumbers.pathFrom = -1
      mind.scratchNumbers.pathSteps = context.memory.random.integer(4, 10)
      mind.target = cellPoint(context, cell)
      return
    }
    mind.phase = 'stroll'
    mind.target = randomOpenPoint(context, cat.position, 260 * context.memory.sizeScale, 24)
  },
  update(cat, mind, context) {
    if (mind.phase === 'promenade' && mind.target) {
      if (distance(cat.position, mind.target) >= 9) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.36, 30)
      const steps = (mind.scratchNumbers.pathSteps ?? 0) - 1
      const next = steps > 0 ? nextPathCell(context, mind.scratchNumbers.pathCell ?? -1, mind.scratchNumbers.pathFrom ?? -1) : null
      if (next !== null) {
        mind.scratchNumbers.pathFrom = mind.scratchNumbers.pathCell ?? -1
        mind.scratchNumbers.pathCell = next
        mind.scratchNumbers.pathSteps = steps
        mind.target = cellPoint(context, next)
        return zeroVector
      }
      mind.phase = 'stroll'
    }
    if (mind.phase === 'stroll' && mind.target) {
      if (distance(cat.position, mind.target) >= 10) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.42)
      mind.phase = 'rest'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.4, 1.4)
      mind.idlePose = context.memory.random.chance(0.7) ? 'sit' : 'loaf'
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) endBehavior(cat, mind, context)
    return zeroVector
  },
}
