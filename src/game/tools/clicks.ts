import { clampToBounds } from '../bounds'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import { clamp } from '../vector'
import type { CatnipPatch, TreatState } from '../types'
import { flickFeather } from './heldToy'
import { CATNIP_RADIUS, MAX_CATNIP_PATCHES, MAX_GROUND_TREATS } from './toolConstants'
import { toolMemoryOf } from './toolState'

function dropTreat(context: StepContext): void {
  const { world, pointer } = context
  const toy = world.heldToy
  if (!toy || toy.tool !== 'treat' || toy.snatchedAt !== null) return
  const memory = toolMemoryOf(world)
  memory.treatSerial += 1
  const treat: TreatState = {
    id: `treat-${memory.treatSerial}`,
    position: { ...toy.position },
    height: toy.height,
    verticalSpeed: 0,
    velocity: { x: clamp(pointer.velocity.x * 0.2, -220, 220), y: clamp(pointer.velocity.y * 0.12, -120, 120) },
    claimedByCatId: null,
    eatenAt: null,
  }
  world.treats.push(treat)
  const uneaten = world.treats.filter((candidate) => candidate.eatenAt === null)
  if (uneaten.length > MAX_GROUND_TREATS) world.treats = world.treats.filter((candidate) => candidate !== uneaten[0])
  toy.snatchedAt = world.time
}

function sprinkleCatnip(context: StepContext): void {
  const { world, pointer } = context
  const memory = toolMemoryOf(world)
  memory.catnipSerial += 1
  const lift = world.heldToy?.tool === 'catnip' ? world.heldToy.height : 0
  const patch: CatnipPatch = {
    id: `catnip-${memory.catnipSerial}`,
    position: clampToBounds({ x: pointer.position.x, y: pointer.position.y + lift }, context.bounds),
    radius: CATNIP_RADIUS * context.memory.sizeScale,
    createdAt: world.time,
    potency: 1,
  }
  world.catnip = [...world.catnip, patch].slice(-MAX_CATNIP_PATCHES)
  spawnEffect(world, 'catnipPuff', patch.position, 6, null, 1)
}

export function handleToolClicks(context: StepContext): void {
  const { world, pointer } = context
  const memory = toolMemoryOf(world)
  const pressedNow = pointer.active && pointer.pressed
  const clicked = pressedNow && !memory.wasPressed
  memory.wasPressed = pressedNow
  if (!clicked) return
  if (pointer.tool === 'treat') dropTreat(context)
  else if (pointer.tool === 'catnip') sprinkleCatnip(context)
  else if (pointer.tool === 'wand') flickFeather(context)
}
