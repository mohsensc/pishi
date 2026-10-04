import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { isNight } from '../../tools/dayCycle'
import { distance } from '../../vector'
import type { CatState, WorldEffect } from '../../types'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from './support/phases'

function nearestFirefly(cat: CatState, context: StepContext): WorldEffect | undefined {
  let best: WorldEffect | undefined
  let bestGap = 360 * context.memory.sizeScale
  context.world.effects.forEach((effect) => {
    if (effect.kind !== 'sparkle' || effect.propId !== null || effect.height < 10) return
    const gap = distance(cat.position, effect.position)
    if (gap < bestGap) {
      bestGap = gap
      best = effect
    }
  })
  return best
}

export const fireflyHuntBehavior: Behavior = {
  id: 'fireflyHunt',
  intent: 'play',
  interruptible: true,
  ownsTimer: true,
  minDuration: 6,
  maxDuration: 9,
  weight: (cat, mind, context) => (isNight(context.world.dayTime) && nearestFirefly(cat, context) ? mind.personality.curiosity * 0.5 : 0),
  start(cat, mind) {
    mind.movePose = 'stalk'
    mind.scratchNumbers.tries = 3
    setEmote(cat, 'curious')
    enterPhase(mind, 'seek')
  },
  update(cat, mind, context) {
    if (mind.phase === 'landed') {
      mind.idlePose = 'peek'
      if (phaseDone(mind)) enterPhase(mind, 'seek')
      return brake(cat)
    }
    const firefly = nearestFirefly(cat, context)
    if (!firefly || (mind.scratchNumbers.tries ?? 0) <= 0 || mind.behaviorElapsed > 12) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const glow = { x: firefly.position.x, y: firefly.position.y - firefly.height }
    gazeAt(cat, mind, glow, 0.3)
    if (distance(cat.position, firefly.position) > 50 * context.memory.sizeScale) return arrive(cat, firefly.position, topSpeed(cat, mind, context) * 0.3, 30)
    mind.scratchNumbers.tries = (mind.scratchNumbers.tries ?? 1) - 1
    startLeap(cat, mind, context, firefly.position, 0, Math.min(firefly.height, 60 + 40 * mind.personality.jumpPower) * cat.coat.scale, 0.5, 'reach', 'none')
    enterPhase(mind, 'landed', 0.7)
    return zeroVector
  },
}
