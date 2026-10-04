import { startleCat } from '../ai/helpers/reactions'
import { clampToBounds } from '../bounds'
import { GRAVITY } from '../constants'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import { add, clamp, distance, length, scale, subtract } from '../vector'
import type { PropKind, PropState, Vec } from '../types'
import { handlingOf, propMotionOf, type PropMotion } from './handlingMemory'
import { recruitInvestigators } from './recruiting'
import { carryRiders, ridersOf } from './riders'

interface Heft {
  stiffness: number
  damping: number
  tiltGain: number
  maxTilt: number
}

const heavyKinds = new Set<PropKind>(['pond', 'tree', 'feedingStation', 'catTree', 'picnicBlanket'])
const lightHeft: Heft = { stiffness: 240, damping: 22, tiltGain: 0.028, maxTilt: 18 }
const heavyHeft: Heft = { stiffness: 46, damping: 11, tiltGain: 0.014, maxTilt: 9 }
const tiltStiffness = 110
const tiltDamping = 7
const liftEase = 9
const bounceRestitution = 0.34
const restingLiftSpeed = 90
const dropStartleRadius = 70

function heftOf(prop: PropState): Heft {
  return heavyKinds.has(prop.kind) ? heavyHeft : lightHeft
}

function moveProp(prop: PropState, next: Vec, lift: number, context: StepContext, carried: boolean, excludeRiderId: string | null): void {
  const delta = subtract(next, prop.position)
  const riders = ridersOf(prop, context, excludeRiderId)
  if (prop.tunnelExit) prop.tunnelExit = add(prop.tunnelExit, delta)
  prop.position = next
  prop.lift = Math.max(0, lift)
  carryRiders(riders, delta, prop.lift, carried)
  context.world.balls.forEach((ball) => {
    if (ball.status === 'stashed' && ball.stashPropId === prop.id) ball.position = add(ball.position, delta)
  })
}

function springToward(motion: PropMotion, prop: PropState, target: Vec, heft: Heft, dt: number): Vec {
  const pull = scale(subtract(target, prop.position), heft.stiffness)
  const acceleration = subtract(pull, scale(motion.velocity, heft.damping))
  motion.velocity = add(motion.velocity, scale(acceleration, dt))
  return add(prop.position, scale(motion.velocity, dt))
}

function stepTilt(motion: PropMotion, prop: PropState, heft: Heft, dt: number, swinging: boolean): void {
  const wanted = swinging ? clamp(-motion.velocity.x * heft.tiltGain, -heft.maxTilt, heft.maxTilt) : 0
  const acceleration = (wanted - prop.tilt) * tiltStiffness - motion.tiltSpeed * tiltDamping
  motion.tiltSpeed += acceleration * dt
  prop.tilt = clamp(prop.tilt + motion.tiltSpeed * dt, -heft.maxTilt * 1.4, heft.maxTilt * 1.4)
}

export function stepCarriedProp(prop: PropState, target: Vec, liftTarget: number, context: StepContext): void {
  const motion = propMotionOf(context.world, prop.id)
  const heft = heftOf(prop)
  motion.carried = true
  motion.landed = false
  const next = clampToBounds(springToward(motion, prop, target, heft, context.dt), context.bounds)
  const bob = Math.sin(context.world.time * 5.2) * 1.2
  const lift = prop.lift + (liftTarget + bob - prop.lift) * (1 - Math.exp(-liftEase * context.dt))
  moveProp(prop, next, lift, context, true, null)
  stepTilt(motion, prop, heft, context.dt, true)
  prop.agitation = Math.max(prop.agitation, 0.35)
}

export function releaseProp(prop: PropState, settleTarget: Vec, fling: Vec, context: StepContext): void {
  const motion = propMotionOf(context.world, prop.id)
  const heft = heftOf(prop)
  motion.carried = false
  motion.landed = false
  motion.settleTarget = settleTarget
  motion.liftSpeed = Math.min(0, -length(fling) * 0.05)
  motion.velocity = add(motion.velocity, scale(fling, heft === heavyHeft ? 0.05 : 0.15))
}

function landImpact(prop: PropState, impactSpeed: number, context: StepContext): void {
  const { world } = context
  prop.droppedAt = world.time
  const intensity = clamp(impactSpeed / 520, 0.35, 1)
  spawnEffect(world, 'dust', prop.position, 0, prop.id, intensity)
  const reach = prop.radius + dropStartleRadius * context.memory.sizeScale
  const riderIds = new Set(ridersOf(prop, context).map(({ cat }) => cat.id))
  world.cats.forEach((cat) => {
    if (cat.hidden || riderIds.has(cat.id)) return
    if (distance(cat.position, prop.position) < reach) startleCat(cat, context, prop.position)
  })
  recruitInvestigators(prop, context)
}

function stepSettlingProp(prop: PropState, motion: PropMotion, context: StepContext): boolean {
  const heft = heftOf(prop)
  const target = motion.settleTarget ?? prop.position
  const next = springToward(motion, prop, target, heft, context.dt)
  motion.liftSpeed -= GRAVITY * context.dt
  let lift = prop.lift + motion.liftSpeed * context.dt
  if (lift <= 0) {
    const impactSpeed = -motion.liftSpeed
    lift = 0
    if (!motion.landed) landImpact(prop, impactSpeed, context)
    motion.landed = true
    motion.liftSpeed = impactSpeed > restingLiftSpeed ? impactSpeed * bounceRestitution : 0
    motion.tiltSpeed += (context.memory.random.next() - 0.5) * impactSpeed * 0.12
  }
  moveProp(prop, next, lift, context, false, null)
  stepTilt(motion, prop, heft, context.dt, false)
  const still = prop.lift <= 0 && motion.liftSpeed === 0 && Math.abs(prop.tilt) < 0.3 && Math.abs(motion.tiltSpeed) < 2
  const arrived = distance(prop.position, target) < 0.6 && length(motion.velocity) < 4
  if (!still || !arrived) return false
  moveProp(prop, target, 0, context, false, null)
  prop.tilt = 0
  return true
}

export function stepSettlingProps(context: StepContext, carriedPropId: string | null): void {
  const motions = handlingOf(context.world).propMotions
  motions.forEach((motion, propId) => {
    if (propId === carriedPropId) return
    const prop = context.world.props.find((candidate) => candidate.id === propId)
    if (!prop) {
      motions.delete(propId)
      return
    }
    if (stepSettlingProp(prop, motion, context)) motions.delete(propId)
  })
}
