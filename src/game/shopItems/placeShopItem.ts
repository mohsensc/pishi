import { boundsCenter, dockKeepOut, lawnBounds, viewportScale } from '../bounds'
import { freeSpotFor } from '../dragging/freeSpot'
import { createPropState, recipeFor } from '../layout'
import type { StepContext } from '../memory'
import { isInPond } from '../physics'
import { createRandom } from '../random'
import { spawnProp } from '../spawning'
import { distance, lerpVec } from '../vector'
import type { PropKind, PropState, Vec, World } from '../types'
import { startDropIn } from './dropIn'

export interface PlacementPreview {
  valid: boolean
  position: Vec
  radius: number
  exit: Vec | null
}

const previewSeed = 7331
const edgeTolerance = 18
const tunnelReach = 150

function previewProp(world: World, kind: PropKind, point: Vec): PropState {
  const sizeScale = viewportScale(world.width, world.height)
  const recipe = recipeFor(kind, sizeScale, createRandom(previewSeed))
  const exit = kind === 'tunnel' ? { x: point.x + tunnelReach * sizeScale, y: point.y } : null
  return createPropState('prop-preview', recipe, point, exit, 0)
}

function footprintCenter(prop: PropState, position: Vec): { center: Vec; radius: number } {
  if (!prop.tunnelExit) return { center: position, radius: prop.radius }
  const exit = { x: prop.tunnelExit.x + position.x - prop.position.x, y: prop.tunnelExit.y + position.y - prop.position.y }
  return { center: lerpVec(position, exit, 0.5), radius: distance(position, exit) / 2 + prop.radius }
}

function overlapsAny(world: World, prop: PropState, position: Vec): boolean {
  const own = footprintCenter(prop, position)
  return world.props.some((other) => {
    if (other.lift > 0.5) return false
    const theirs = footprintCenter(other, other.position)
    return distance(own.center, theirs.center) < own.radius + theirs.radius - 2
  })
}

function insideLawn(world: World, point: Vec): boolean {
  const bounds = lawnBounds(world.width, world.height)
  const inside = point.x >= bounds.left - edgeTolerance && point.x <= bounds.right + edgeTolerance && point.y >= bounds.top - edgeTolerance && point.y <= bounds.bottom + edgeTolerance
  if (!inside) return false
  const dock = dockKeepOut(world.width, world.height)
  return !dock || point.x > dock.right || point.y < dock.top || point.y > dock.bottom
}

export function placementPreview(world: World, kind: PropKind, point: Vec): PlacementPreview {
  const prop = previewProp(world, kind, point)
  const sizeScale = viewportScale(world.width, world.height)
  const bounds = lawnBounds(world.width, world.height)
  const spot = freeSpotFor(prop, point, world.props, bounds, sizeScale)
  const tolerance = Math.max(prop.radius * 1.4, 46 * sizeScale)
  const pondMargin = kind === 'pond' ? 2.2 : 1.1
  const valid = insideLawn(world, point) && distance(spot, point) <= tolerance && !overlapsAny(world, prop, spot) && !isInPond(world.props, spot, pondMargin)
  const exit = prop.tunnelExit ? { x: spot.x + tunnelReach * sizeScale, y: spot.y } : null
  return { valid, position: spot, radius: prop.radius, exit }
}

export function defaultPlacementPoint(context: StepContext): Vec {
  const center = boundsCenter(context.bounds)
  return { x: center.x + context.memory.random.range(-0.15, 0.15) * (context.bounds.right - context.bounds.left), y: center.y + context.memory.random.range(-0.1, 0.15) * (context.bounds.bottom - context.bounds.top) }
}

function clearSpawnDust(world: World, propId: string): void {
  world.effects = world.effects.filter((effect) => !(effect.propId === propId && effect.kind === 'dust' && effect.time === world.time))
}

export function placeShopProp(context: StepContext, kind: PropKind, point: Vec | null): string | null {
  const { world } = context
  let target = point ?? defaultPlacementPoint(context)
  if (point) {
    const preview = placementPreview(world, kind, point)
    if (!preview.valid) return null
    target = preview.position
  }
  const propId = spawnProp(world, kind, target)
  if (!propId) return null
  clearSpawnDust(world, propId)
  startDropIn(context, propId)
  return propId
}
