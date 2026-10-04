import { lawnBounds } from './bounds'
import type { Random } from './random'
import { clamp, distance } from './vector'
import type { ButterflyState, PropState, Vec, World } from './types'

const butterflySpeed = 46
const escapeSpeed = 170
const minimumHeight = 26
const maximumHeight = 120

const maximumButterflies = 9
const lampAttraction = 260
const lampHoverHeight = 110

interface ButterflyMotion {
  escapeTimer: number
  wobble: number
  targetHeight: number
  expiresAt: number | null
}

const butterflySerials = new WeakMap<World, number>()

const butterflyMotion = new WeakMap<ButterflyState, ButterflyMotion>()

function motionOf(butterfly: ButterflyState): ButterflyMotion {
  let motion = butterflyMotion.get(butterfly)
  if (!motion) {
    motion = { escapeTimer: 0, wobble: butterfly.hue * 0.01, targetHeight: 60, expiresAt: null }
    butterflyMotion.set(butterfly, motion)
  }
  return motion
}

export function createButterflies(count: number, width: number, height: number, random: Random): ButterflyState[] {
  const bounds = lawnBounds(width, height, 20)
  const hues = [42, 28, 198, 12, 52, 185]
  return Array.from({ length: count }, (_, index) => ({
    id: `butterfly-${index}`,
    position: { x: random.range(bounds.left, bounds.right), y: random.range(bounds.top, bounds.bottom) },
    height: random.range(40, 90),
    heading: random.range(0, Math.PI * 2),
    hue: hues[index % hues.length],
    clock: random.range(0, 10),
  }))
}

export function scareButterfly(butterfly: ButterflyState, from: Vec): void {
  const motion = motionOf(butterfly)
  motion.escapeTimer = 1.1
  motion.targetHeight = maximumHeight
  butterfly.heading = Math.atan2(butterfly.position.y - from.y, butterfly.position.x - from.x)
}

export function scatterButterflies(world: World, from: Vec, radius: number): number {
  const nearby = world.butterflies.filter((butterfly) => distance(butterfly.position, from) < radius)
  nearby.forEach((butterfly) => scareButterfly(butterfly, from))
  return nearby.length
}

export function spawnButterflies(world: World, from: Vec, count: number, random: Random, lifetime = 24): number {
  const room = Math.max(0, maximumButterflies - world.butterflies.length)
  const hues = [42, 28, 198, 12, 52, 185, 330]
  const spawned = Math.min(room, count)
  for (let index = 0; index < spawned; index += 1) {
    const serial = (butterflySerials.get(world) ?? 0) + 1
    butterflySerials.set(world, serial)
    const butterfly: ButterflyState = {
      id: `butterfly-extra-${serial}`,
      position: { x: from.x + random.range(-20, 20), y: from.y + random.range(-10, 10) },
      height: random.range(14, 30),
      heading: random.range(0, Math.PI * 2),
      hue: random.pick(hues),
      clock: random.range(0, 10),
    }
    world.butterflies.push(butterfly)
    const motion = motionOf(butterfly)
    motion.expiresAt = world.time + lifetime + random.range(-4, 4)
    scareButterfly(butterfly, from)
  }
  return spawned
}

function steerToward(butterfly: ButterflyState, target: Vec, strength: number, dt: number): void {
  const wanted = Math.atan2(target.y - butterfly.position.y, target.x - butterfly.position.x)
  const difference = Math.atan2(Math.sin(wanted - butterfly.heading), Math.cos(wanted - butterfly.heading))
  butterfly.heading += difference * Math.min(1, strength * dt)
}

function litLampNear(world: World, butterfly: ButterflyState): PropState | undefined {
  return world.props.find((prop) => prop.kind === 'lamppost' && prop.lit && distance(prop.position, butterfly.position) < lampAttraction)
}

export function stepButterflies(world: World, dt: number, random: Random, pointer: Vec | null): void {
  const bounds = lawnBounds(world.width, world.height, 16)
  world.butterflies = world.butterflies.filter((butterfly) => {
    const expiresAt = motionOf(butterfly).expiresAt
    return expiresAt === null || world.time < expiresAt
  })
  world.butterflies.forEach((butterfly, index) => {
    const motion = motionOf(butterfly)
    butterfly.clock += dt
    motion.escapeTimer = Math.max(0, motion.escapeTimer - dt)
    butterfly.heading += (random.next() - 0.5) * 3.2 * dt + Math.sin(butterfly.clock * 0.7 + motion.wobble) * 0.6 * dt
    const centerX = (bounds.left + bounds.right) / 2
    const centerY = (bounds.top + bounds.bottom) / 2
    const nearEdge =
      butterfly.position.x < bounds.left + 40 ||
      butterfly.position.x > bounds.right - 40 ||
      butterfly.position.y < bounds.top + 30 ||
      butterfly.position.y > bounds.bottom - 30
    if (nearEdge) {
      const homeHeading = Math.atan2(centerY - butterfly.position.y, centerX - butterfly.position.x)
      const difference = Math.atan2(Math.sin(homeHeading - butterfly.heading), Math.cos(homeHeading - butterfly.heading))
      butterfly.heading += difference * Math.min(1, 2.5 * dt)
    }
    const lamp = index % 2 === 0 && motion.escapeTimer <= 0 ? litLampNear(world, butterfly) : undefined
    if (lamp) {
      steerToward(butterfly, lamp.position, distance(lamp.position, butterfly.position) > 40 ? 3 : 0.6, dt)
      motion.targetHeight = lampHoverHeight
    }
    if (pointer && distance(pointer, butterfly.position) < 60 && motion.escapeTimer <= 0) scareButterfly(butterfly, pointer)
    const speed = motion.escapeTimer > 0 ? escapeSpeed : butterflySpeed * (0.7 + 0.5 * Math.abs(Math.sin(butterfly.clock * 1.3)))
    butterfly.position.x = clamp(butterfly.position.x + Math.cos(butterfly.heading) * speed * dt, bounds.left, bounds.right)
    butterfly.position.y = clamp(butterfly.position.y + Math.sin(butterfly.heading) * speed * 0.7 * dt, bounds.top, bounds.bottom)
    if (motion.escapeTimer <= 0 && random.chance(dt * 0.3)) motion.targetHeight = random.range(minimumHeight + 10, 95)
    const flutter = Math.sin(butterfly.clock * 9) * 3
    butterfly.height = clamp(butterfly.height + (motion.targetHeight - butterfly.height) * Math.min(1, 1.6 * dt) + flutter * dt * 10, minimumHeight, maximumHeight)
  })
}
