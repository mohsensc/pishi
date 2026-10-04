import { clampToBounds } from '../../bounds'
import { spawnEffect } from '../../effects'
import type { CatMind, StepContext } from '../../memory'
import { add, distance, length, normalize, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { isOpenGround, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { quit } from '../helpers/propUse'

export function launchYarn(mind: CatMind, context: StepContext, from: Vec, direction: Vec, speed: number): void {
  mind.scratchPoints.yarn = { x: from.x, y: from.y }
  mind.scratchPoints.yarnVelocity = scale(normalize(direction), speed * context.memory.speedScale)
  mind.scratchNumbers.pounces = mind.scratchNumbers.pounces ?? context.memory.random.integer(3, 5)
}

function rollYarn(mind: CatMind, context: StepContext, yarn: Vec, velocity: Vec): void {
  const next = clampToBounds(add(yarn, scale(velocity, context.dt)), context.bounds)
  if (isOpenGround(next, context, 6)) mind.scratchPoints.yarn = next
  else mind.scratchPoints.yarnVelocity = scale(velocity, -0.5)
  const damped = mind.scratchPoints.yarnVelocity ?? velocity
  mind.scratchPoints.yarnVelocity = scale(damped, Math.exp(-1.7 * context.dt))
  const trailAt = mind.scratchNumbers.trailAt ?? 0
  if (context.world.time >= trailAt) {
    mind.scratchNumbers.trailAt = context.world.time + 0.45
    spawnEffect(context.world, 'yarn', mind.scratchPoints.yarn ?? yarn, 3, null, 0.5)
  }
}

export function chaseYarn(cat: CatState, mind: CatMind, context: StepContext): Vec {
  const yarn = mind.scratchPoints.yarn
  const velocity = mind.scratchPoints.yarnVelocity ?? zeroVector
  if (!yarn) return quit(cat, mind, context)
  if (mind.scratchNumbers.pending === 1) {
    mind.scratchNumbers.pending = 0
    const random = context.memory.random
    lockPose(mind, 'bat', 0.25)
    const away = normalize(add(subtract(yarn, cat.position), { x: random.range(-1, 1), y: random.range(-1, 1) }))
    mind.scratchPoints.yarnVelocity = scale(away, random.range(130, 230) * context.memory.speedScale)
    if (random.chance(0.35)) setEmote(cat, 'playful')
    return zeroVector
  }
  rollYarn(mind, context, yarn, velocity)
  mind.scratchPoints.gaze = yarn
  const gap = distance(cat.position, yarn)
  const settled = length(velocity) < 70
  if (settled && gap < 90 * context.memory.sizeScale && mind.decisionTimer <= 0) {
    const pounces = (mind.scratchNumbers.pounces ?? 1) - 1
    mind.scratchNumbers.pounces = pounces
    if (pounces < 0) return quit(cat, mind, context)
    mind.scratchNumbers.pending = 1
    mind.decisionTimer = randomTimer(context, 0.4, 0.8)
    startLeap(cat, mind, context, subtract(yarn, { x: Math.sign(yarn.x - cat.position.x) * 10, y: 0 }), 0, 20 + 10 * mind.personality.jumpPower, 0.36, 'pounce', 'none')
    return zeroVector
  }
  mind.movePose = settled ? 'stalk' : null
  return arrive(cat, yarn, topSpeed(cat, mind, context) * (settled ? 0.35 : 0.85), 30)
}
