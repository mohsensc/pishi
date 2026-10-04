import { mouthPoint } from '../ai/helpers/queries'
import { clampToBounds } from '../bounds'
import type { StepContext } from '../memory'
import { add, length, scale, subtract } from '../vector'
import type { HeldToyState, ToolKind, Vec } from '../types'
import { easeLift, groundUnder } from './lift'
import { TREAT_RESPAWN_SECONDS, WAND_GRAVITY, WAND_SPRING_DAMPING, WAND_SPRING_STIFFNESS, WAND_STRING_LENGTH } from './toolConstants'
import { toolMemoryOf } from './toolState'

const heldTools = new Set<ToolKind>(['treat', 'wand', 'laser', 'brush', 'catnip'])

function freshToy(tool: ToolKind, screen: Vec): HeldToyState {
  return { tool, position: { x: screen.x, y: screen.y }, height: 0, grabbedByCatId: null, tugProgress: 0, snatchedAt: null }
}

export function wandStringLength(context: StepContext): number {
  return WAND_STRING_LENGTH * Math.max(0.75, context.memory.sizeScale)
}

function featherScreenPoint(context: StepContext, tip: Vec): Vec {
  const memory = toolMemoryOf(context.world)
  const rope = wandStringLength(context)
  const current = memory.featherScreen ?? { x: tip.x, y: tip.y + rope }
  const rest = { x: tip.x, y: tip.y + rope }
  const pull = scale(subtract(rest, current), WAND_SPRING_STIFFNESS)
  const damping = scale(memory.featherVelocity, -WAND_SPRING_DAMPING)
  const acceleration = add(add(pull, damping), { x: 0, y: WAND_GRAVITY * 0.2 })
  memory.featherVelocity = add(memory.featherVelocity, scale(acceleration, context.dt))
  let next = add(current, scale(memory.featherVelocity, context.dt))
  const offset = subtract(next, tip)
  const stretch = length(offset)
  if (stretch > rope * 1.6) next = add(tip, scale(offset, (rope * 1.6) / stretch))
  memory.featherScreen = next
  return next
}

function pinToCat(toy: HeldToyState, context: StepContext): boolean {
  const holder = context.world.cats.find((cat) => cat.id === toy.grabbedByCatId)
  if (!holder || holder.hidden) {
    toy.grabbedByCatId = null
    toy.tugProgress = 0
    return false
  }
  const mouth = mouthPoint(holder)
  toy.position = { x: mouth.x, y: mouth.y }
  toy.height = holder.height + 14 * holder.coat.scale
  const memory = toolMemoryOf(context.world)
  memory.featherScreen = { x: toy.position.x, y: toy.position.y - toy.height }
  memory.featherVelocity = { x: 0, y: 0 }
  return true
}

function placeLifted(toy: HeldToyState, screen: Vec, context: StepContext): void {
  toy.height = easeLift(screen, toy.height, context)
  toy.position = groundUnder(screen, toy.height)
}

export function updateHeldToy(context: StepContext): void {
  const { world, pointer } = context
  const memory = toolMemoryOf(world)
  if (!pointer.active || !heldTools.has(pointer.tool)) {
    if (world.heldToy?.grabbedByCatId && world.heldToy.tool === 'wand' && pinToCat(world.heldToy, context)) return
    world.heldToy = null
    memory.featherScreen = null
    return
  }
  if (!world.heldToy || world.heldToy.tool !== pointer.tool) {
    world.heldToy = freshToy(pointer.tool, pointer.position)
    memory.featherScreen = null
    memory.featherVelocity = { x: 0, y: 0 }
  }
  const toy = world.heldToy
  if (toy.snatchedAt !== null && world.time - toy.snatchedAt > TREAT_RESPAWN_SECONDS && !toy.grabbedByCatId) toy.snatchedAt = null
  if (toy.tool === 'laser') {
    toy.height = 0
    toy.position = clampToBounds(pointer.position, context.bounds)
    memory.laserSeenAt = world.time
    memory.laserLast = { ...toy.position }
    return
  }
  if (toy.tool === 'wand') {
    if (toy.grabbedByCatId && pinToCat(toy, context)) return
    placeLifted(toy, featherScreenPoint(context, pointer.position), context)
    return
  }
  placeLifted(toy, pointer.position, context)
}

export function flickFeather(context: StepContext): void {
  const memory = toolMemoryOf(context.world)
  memory.featherVelocity = add(memory.featherVelocity, { x: context.memory.random.range(-160, 160), y: -520 })
}
