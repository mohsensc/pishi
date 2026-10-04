import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import type { Vec } from '../../types'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

const chaseableEffects = new Set(['leaves', 'petals', 'dust', 'sparkle'])

function driftShadow(shadow: Vec, clock: number, dt: number, speed: number): Vec {
  const angle = Math.sin(clock * 1.7) * 2.6 + Math.sin(clock * 0.61 + 2) * 2
  return { x: shadow.x + Math.cos(angle) * speed * dt, y: shadow.y + Math.sin(angle) * speed * 0.7 * dt }
}

export const shadowChaseBehavior: Behavior = {
  id: 'shadowChase',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (_cat, mind, context) => (0.07 + mind.personality.curiosity * 0.1) * (context.world.effects.length > 0 ? 1.6 : 1),
  start(cat, mind, context) {
    const effect = context.world.effects.find((candidate) => chaseableEffects.has(candidate.kind) && distance(candidate.position, cat.position) < sizeScaled(context, 320))
    mind.scratchPoints.shadow = effect ? { ...effect.position } : { x: cat.position.x + cat.facing * sizeScaled(context, 60), y: cat.position.y }
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
    setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    const shadow = clampToBounds(driftShadow(mind.scratchPoints.shadow, cat.clock, context.dt, sizeScaled(context, 90)), context.bounds)
    mind.scratchPoints.shadow = shadow
    mind.scratchPoints.gaze = shadow
    if (mind.phase === 'crouch') {
      if (!phaseDone(mind)) return brake(cat, 6)
      mind.attempts += 1
      startLeap(cat, mind, context, shadow, 0, 20, 0.32, 'pounce', 'none')
      mind.scratchPoints.shadow = { x: shadow.x + context.memory.random.range(-70, 70), y: shadow.y + context.memory.random.range(-40, 40) }
      enterPhase(mind, 'chase')
      return zeroVector
    }
    if (mind.attempts >= 4) return finishBehavior(cat, mind, context)
    if (distance(cat.position, shadow) < sizeScaled(context, 48) && mind.phaseTimer > 0.6) {
      enterPhase(mind, 'crouch', randomTimer(context, 0.2, 0.45))
      return zeroVector
    }
    return arrive(cat, shadow, paceSpeed(cat, mind, context, 0.62), 20)
  },
}
