import { clampToBounds, pushOutOfDock } from '../../bounds'
import { propSolidHeight } from '../../layout'
import type { CatMind, StepContext } from '../../memory'
import { add, clamp, closestOnSegment, dot, length, limit, normalize, perpendicular, scale, subtract } from '../../vector'
import type { CatState, Vec } from '../../types'
import { bodyLength, catRadius, pushOutOfPond, zeroVector } from './queries'
import { topSpeed } from './threat'

export function arrive(cat: CatState, target: Vec, speed: number, slowRadius = 60): Vec {
  const offset = subtract(target, cat.position)
  const gap = length(offset)
  if (gap < 2) return zeroVector
  return scale(offset, (speed * Math.min(1, gap / slowRadius)) / gap)
}

export function seek(cat: CatState, target: Vec, speed: number): Vec {
  return scale(normalize(subtract(target, cat.position)), speed)
}

export function fleeFrom(cat: CatState, threat: Vec, speed: number): Vec {
  const away = normalize(subtract(cat.position, threat))
  return scale(length(away) > 0.5 ? away : { x: cat.facing, y: 0 }, speed)
}

export function orbit(cat: CatState, center: Vec, radius: number, speed: number, direction: 1 | -1 = 1): Vec {
  const offset = subtract(cat.position, center)
  const gap = Math.max(1, length(offset))
  const radial = scale(offset, 1 / gap)
  const tangent = scale(perpendicular(radial), direction)
  const correction = clamp((radius - gap) / Math.max(20, radius), -1, 1)
  return scale(normalize(add(tangent, scale(radial, correction * 1.4))), speed)
}

export function brake(cat: CatState, strength = 4): Vec {
  return scale(cat.velocity, -strength)
}

function separation(cat: CatState, context: StepContext, personalSpace: number, strength = 140): Vec {
  let steering: Vec = { x: 0, y: 0 }
  context.world.cats.forEach((other) => {
    if (other.id === cat.id || other.hidden || other.height > 20) return
    const offset = subtract(cat.position, other.position)
    const gap = length(offset)
    if (gap >= personalSpace || gap < 1e-3) return
    steering = add(steering, scale(offset, ((1 - gap / personalSpace) * strength) / gap))
  })
  return steering
}

function obstacleAvoidance(cat: CatState, mind: CatMind, context: StepContext, desired: Vec): Vec {
  const speed = length(desired)
  if (speed < 1) return zeroVector
  let steering: Vec = { x: 0, y: 0 }
  const radius = catRadius(cat)
  const heading = scale(desired, 1 / speed)
  const lookAhead = 70 * context.memory.sizeScale
  const targetPropId = mind.propTargetId ?? mind.climbPlan?.propId ?? null
  context.world.props.forEach((prop) => {
    if (prop.id === targetPropId) return
    let center = prop.position
    let reach = 0
    if (prop.kind === 'pond') reach = prop.radius + radius
    else if (prop.tunnelExit) {
      center = closestOnSegment(cat.position, prop.position, prop.tunnelExit)
      reach = prop.radius + radius
    } else if (prop.solid) reach = prop.radius + radius + 4
    else return
    const toCenter = subtract(center, cat.position)
    const along = dot(toCenter, heading)
    if (along < -reach * 0.3 || along > reach + lookAhead) return
    const closest = subtract(toCenter, scale(heading, along))
    const lateral = length(closest)
    if (lateral >= reach) return
    const away = lateral > 1e-3 ? scale(closest, -1 / lateral) : perpendicular(heading)
    const strength = (1 - lateral / reach) * speed * 1.3 * (1 - clamp(along / (reach + lookAhead), 0, 1) * 0.5)
    steering = add(steering, scale(away, strength))
  })
  return steering
}

function pushOut(cat: CatState, center: Vec, reach: number): void {
  const offset = subtract(cat.position, center)
  const gap = length(offset)
  if (gap >= reach) return
  const normal = gap > 1e-3 ? scale(offset, 1 / gap) : { x: 0, y: 1 }
  cat.position = add(center, scale(normal, reach))
  const inward = dot(cat.velocity, normal)
  if (inward < 0) cat.velocity = subtract(cat.velocity, scale(normal, inward))
}

export function resolveCollisions(cat: CatState, context: StepContext): void {
  const radius = catRadius(cat)
  context.world.props.forEach((prop) => {
    if (prop.kind === 'pond') {
      cat.position = pushOutOfPond(cat.position, prop, radius, { x: 1, y: 0 })
      return
    }
    if (prop.tunnelExit) {
      pushOut(cat, closestOnSegment(cat.position, prop.position, prop.tunnelExit), prop.radius + radius * 0.8)
      return
    }
    if (!prop.solid || cat.height > propSolidHeight(prop)) return
    pushOut(cat, prop.position, prop.radius + radius)
  })
  const clamped = pushOutOfDock(clampToBounds(cat.position, context.bounds), context.world.width, context.world.height)
  if (clamped.x !== cat.position.x) cat.velocity.x = 0
  if (clamped.y !== cat.position.y) cat.velocity.y = 0
  cat.position = clamped
}

export function applySteering(cat: CatState, mind: CatMind, context: StepContext, desired: Vec): void {
  const speed = topSpeed(cat, mind, context)
  const avoidance = add(separation(cat, context, bodyLength(cat) * 0.7), obstacleAvoidance(cat, mind, context, desired))
  const target = limit(add(desired, avoidance), speed * 1.1)
  const acceleration = mind.personality.acceleration * context.memory.speedScale * cat.speedMultiplier
  const change = limit(subtract(target, cat.velocity), acceleration * context.dt)
  cat.velocity = add(cat.velocity, change)
  const before = cat.position
  cat.position = add(cat.position, scale(cat.velocity, context.dt))
  resolveCollisions(cat, context)
  trackStuck(cat, mind, context, desired, before, speed)
}

function trackStuck(cat: CatState, mind: CatMind, context: StepContext, desired: Vec, before: Vec, speed: number): void {
  const pushing = length(desired) > speed * 0.3 && length(cat.velocity) > 12
  const moved = length(subtract(cat.position, before)) / Math.max(1e-4, context.dt)
  if (pushing && moved < length(cat.velocity) * 0.2) mind.stuckSeconds += context.dt
  else mind.stuckSeconds = Math.max(0, mind.stuckSeconds - context.dt * 2)
}

export function coast(cat: CatState, context: StepContext, damping = 6): void {
  cat.velocity = scale(cat.velocity, Math.exp(-damping * context.dt))
  cat.position = add(cat.position, scale(cat.velocity, context.dt))
  resolveCollisions(cat, context)
}
