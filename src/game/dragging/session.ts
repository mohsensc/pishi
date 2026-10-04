import { DRAG_LIFT } from '../constants'
import { interactionContext } from '../engine'
import { toScreen } from '../projection'
import { removeLooseToy, removeProp } from '../spawning'
import { subtract } from '../vector'
import type { CatState, DragState, DragTarget, Vec, World } from '../types'
import { prepareGrab } from './grabbing'
import { releaseDragged } from './release'

interface Grabbable {
  position: Vec
  height: number
}

const scruffHeight = 34

function grabbableOf(world: World, target: DragTarget, id: string): Grabbable | undefined {
  if (target === 'prop') {
    const prop = world.props.find((candidate) => candidate.id === id)
    return prop ? { position: prop.position, height: prop.lift } : undefined
  }
  if (target === 'cat') return world.cats.find((candidate) => candidate.id === id && !candidate.hidden)
  if (target === 'ball') return world.balls.find((candidate) => candidate.id === id && candidate.status === 'loose')
  return world.treats.find((candidate) => candidate.id === id && candidate.eatenAt === null)
}

function isGrabbable(world: World, target: DragTarget, id: string): boolean {
  return grabbableOf(world, target, id) !== undefined
}

export function isDragging(world: World, target: DragTarget, id: string): boolean {
  return world.drag !== null && world.drag.target === target && world.drag.id === id
}

function scruffOffset(cat: CatState): Vec {
  return { x: 0, y: -scruffHeight * cat.coat.scale }
}

function grabOffsetFor(world: World, target: DragTarget, id: string, grabbable: Grabbable, point: Vec): Vec {
  const cat = target === 'cat' ? world.cats.find((candidate) => candidate.id === id) : undefined
  if (cat) return scruffOffset(cat)
  if (target === 'ball' || target === 'treat') return { x: 0, y: 0 }
  return subtract(point, toScreen(grabbable.position, grabbable.height))
}

export function beginDrag(world: World, target: DragTarget, id: string, point: Vec): boolean {
  if (world.drag) return false
  const grabbable = grabbableOf(world, target, id)
  if (!grabbable) return false
  const context = interactionContext(world)
  prepareGrab(target, id, point, context)
  const drag: DragState = {
    target,
    id,
    grabOffset: grabOffsetFor(world, target, id, grabbable, point),
    startedAt: world.time,
    pointer: { x: point.x, y: point.y },
    velocity: { x: 0, y: 0 },
    lift: DRAG_LIFT[target],
  }
  world.drag = drag
  return true
}

export function updateDrag(world: World, point: Vec, velocity: Vec): void {
  if (!world.drag) return
  world.drag.pointer = { x: point.x, y: point.y }
  world.drag.velocity = { x: velocity.x, y: velocity.y }
}

export function endDrag(world: World, point: Vec, velocity: Vec): boolean {
  const drag = world.drag
  if (!drag) return false
  updateDrag(world, point, velocity)
  const context = interactionContext(world)
  world.drag = null
  if (isGrabbable(world, drag.target, drag.id)) releaseDragged(drag, velocity, { ...context, dt: 0 })
  return true
}

function cancelDrag(world: World): void {
  const drag = world.drag
  if (!drag) return
  endDrag(world, drag.pointer, { x: 0, y: 0 })
}

export function discardDrag(world: World): boolean {
  const drag = world.drag
  if (!drag) return false
  if (drag.target === 'prop' || drag.target === 'ball') {
    const removed = drag.target === 'prop' ? removeProp(world, drag.id) : removeLooseToy(world, drag.id)
    if (removed) {
      world.drag = null
      return true
    }
  }
  cancelDrag(world)
  return false
}

