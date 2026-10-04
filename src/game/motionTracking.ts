import { spawnEffect } from './effects'
import type { CatState, Vec, World } from './types'

const accelerationSmoothing = 12
const groundedHeight = 1
const skidMinimumSpeed = 130
const skidDeceleration = 700
const hardLandingSpeed = 320
const dustCooldownSeconds = 0.55

export interface MotionSample {
  velocity: Vec
  height: number
  verticalSpeed: number
}

const lastDustTimes = new WeakMap<World, Map<string, number>>()

function dustTimesOf(world: World): Map<string, number> {
  let times = lastDustTimes.get(world)
  if (!times) {
    times = new Map()
    lastDustTimes.set(world, times)
  }
  return times
}

function kickDust(world: World, cat: CatState, intensity: number): void {
  const times = dustTimesOf(world)
  const last = times.get(cat.id) ?? Number.NEGATIVE_INFINITY
  if (world.time - last < dustCooldownSeconds) return
  times.set(cat.id, world.time)
  spawnEffect(world, 'dust', { x: cat.position.x, y: cat.position.y + 1 }, 0, null, intensity)
}

function isSkidding(cat: CatState): boolean {
  if (cat.hidden || cat.height > groundedHeight) return false
  const speed = Math.hypot(cat.velocity.x, cat.velocity.y)
  if (speed < skidMinimumSpeed) return false
  const braking = -(cat.acceleration.x * cat.velocity.x + cat.acceleration.y * cat.velocity.y) / speed
  return braking > skidDeceleration
}

export function sampleMotion(world: World): Map<string, MotionSample> {
  return new Map(
    world.cats.map((cat) => [cat.id, { velocity: { x: cat.velocity.x, y: cat.velocity.y }, height: cat.height, verticalSpeed: cat.verticalSpeed }]),
  )
}

export function trackMotion(world: World, samples: Map<string, MotionSample>, dt: number): void {
  if (dt <= 0) return
  const blend = 1 - Math.exp(-accelerationSmoothing * dt)
  world.cats.forEach((cat) => {
    const sample = samples.get(cat.id)
    if (!sample) return
    const instantX = (cat.velocity.x - sample.velocity.x) / dt
    const instantY = (cat.velocity.y - sample.velocity.y) / dt
    cat.acceleration = {
      x: Number.isFinite(instantX) ? cat.acceleration.x + (instantX - cat.acceleration.x) * blend : 0,
      y: Number.isFinite(instantY) ? cat.acceleration.y + (instantY - cat.acceleration.y) * blend : 0,
    }
    const wasGrounded = sample.height <= groundedHeight
    const isGrounded = cat.height <= groundedHeight
    if (wasGrounded && !isGrounded) cat.launchedAt = world.time
    if (!wasGrounded && isGrounded) {
      cat.landedAt = world.time
      if (!cat.hidden && sample.verticalSpeed < -hardLandingSpeed) kickDust(world, cat, 0.3)
    }
    if (isSkidding(cat)) kickDust(world, cat, 0.25)
  })
}
