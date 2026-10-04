import { clampToBounds } from '../../bounds'
import { hidingHeightOf } from '../../layout'
import type { CatMind, StepContext } from '../../memory'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { dropHeldBall } from './ball'
import { startLeap } from './leap'
import { setEmote } from './pose'
import { catRadius, isOpenGround, mindOf } from './queries'
import { beginFlee, endBehavior } from './transitions'

export function isBoxFree(box: PropState, context: StepContext, catId: string | null = null): boolean {
  if (box.occupantIds.some((id) => id !== catId)) return false
  for (const record of context.memory.stashes.values()) if (record.propId === box.id) return false
  return true
}

export function boxFront(box: PropState, cat: CatState): Vec {
  return { x: box.position.x, y: box.position.y + box.radius + catRadius(cat) + 4 }
}

export function hideIn(cat: CatState, mind: CatMind, prop: PropState, holdDuration: number, context: StepContext): void {
  cat.hidden = true
  cat.propId = prop.id
  cat.position = { x: prop.position.x, y: prop.position.y + 2 }
  cat.velocity = { x: 0, y: 0 }
  cat.height = hidingHeightOf(prop, context.world.height)
  mind.phase = 'inside'
  mind.phaseTimer = 0
  mind.holdDuration = holdDuration
}

export function emergeFrom(cat: CatState, prop: PropState, context: StepContext): void {
  cat.hidden = false
  cat.propId = null
  cat.height = 0
  const side = context.memory.random.sign()
  cat.position = clampToBounds({ x: prop.position.x + side * prop.radius * 0.4, y: prop.position.y + prop.radius + catRadius(cat) + 4 }, context.bounds)
  cat.facing = side
}

function nearestMouth(prop: PropState, cat: CatState): { mouth: Vec; outward: Vec } {
  const exit = prop.tunnelExit ?? prop.position
  const nearStart = distance(cat.position, prop.position) <= distance(cat.position, exit)
  const mouth = nearStart ? prop.position : exit
  const other = nearStart ? exit : prop.position
  return { mouth, outward: normalize(subtract(mouth, other)) }
}

function openDirection(prop: PropState, cat: CatState, context: StepContext, reach: number): Vec {
  const random = context.memory.random
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const angle = random.range(0, Math.PI * 2)
    const direction = { x: Math.cos(angle), y: Math.sin(angle) * 0.75 }
    const landing = add(prop.position, scale(direction, reach))
    if (isOpenGround(landing, context, catRadius(cat))) return direction
  }
  return { x: random.sign(), y: 0.4 }
}

export function popOut(cat: CatState, prop: PropState, context: StepContext): void {
  const mind = mindOf(cat, context)
  const wasHeight = cat.height
  cat.hidden = false
  cat.propId = null
  mind.perch = null
  mind.climbPlan = null
  mind.leap = null
  dropHeldBall(cat, mind, context, prop.position)
  if (context.pointer.active) beginFlee(cat, mind, context, 1.2)
  else endBehavior(cat, mind, context)
  const reach = prop.radius + catRadius(cat) + context.memory.random.range(30, 60) * context.memory.sizeScale
  let origin = prop.position
  let direction = openDirection(prop, cat, context, reach)
  if (prop.tunnelExit) {
    const { mouth, outward } = nearestMouth(prop, cat)
    origin = mouth
    direction = outward
  }
  cat.position = { x: origin.x, y: origin.y }
  cat.height = Math.max(wasHeight, hidingHeightOf(prop, context.world.height))
  const landing = add(origin, scale(direction, prop.tunnelExit ? reach * 1.3 : reach))
  const peak = 26 + 18 * mind.personality.jumpPower
  startLeap(cat, mind, context, landing, 0, peak, 0.42 + cat.height / 600, 'startle', 'startle')
  setEmote(cat, 'startled')
}

export function popOutAll(prop: PropState, context: StepContext): number {
  const hidden = context.world.cats.filter((cat) => cat.propId === prop.id && cat.hidden)
  hidden.forEach((cat) => popOut(cat, prop, context))
  return hidden.length
}
