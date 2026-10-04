import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { distance } from '../../vector'
import type { Vec } from '../../types'
import { enterPhase, finishBehavior, isNight, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomOpenPoint, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

function isSunny(point: Vec, context: StepContext): boolean {
  return !context.world.props.some((prop) => prop.kind === 'tree' && distance(prop.position, point) < prop.radius * 2.2)
}

function sunnySpot(around: Vec, context: StepContext): Vec {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomOpenPoint(context, around, sizeScaled(context, 220), 34)
    if (isSunny(candidate, context)) return candidate
  }
  return randomOpenPoint(context, around, sizeScaled(context, 220), 34)
}

export const loafInSunBehavior: Behavior = {
  id: 'loafInSun',
  intent: 'wander',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind, context) => mind.personality.laziness * 0.22 * (isNight(context) ? 0.3 : 1),
  start(cat, mind, context) {
    mind.target = sunnySpot(cat.position, context)
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    if (mind.phase === 'bask') {
      mind.idlePose = mind.phaseTimer > 1.2 ? 'loaf' : 'sit'
      mind.scratchPoints.gaze = { x: cat.position.x + cat.facing * 60, y: cat.position.y - 120 }
      if (mind.phaseTimer > 3 && cat.emote === null && context.memory.random.chance(context.dt * 0.2)) setEmote(cat, 'sleepy')
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (!mind.target || distance(cat.position, mind.target) < sizeScaled(context, 10) || mind.phaseTimer > 6) {
      setEmote(cat, 'sleepy')
      enterPhase(mind, 'bask', randomTimer(context, 5, 9))
      return zeroVector
    }
    return arrive(cat, mind.target, paceSpeed(cat, mind, context, 0.26), 24)
  },
}
