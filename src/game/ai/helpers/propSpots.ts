import { clampToBounds } from '../../bounds'
import { hidingHeightOf } from '../../layout'
import type { CatMind, PerchSpot, StepContext } from '../../memory'
import { depthScale } from '../../projection'
import { add, length, normalize, subtract } from '../../vector'
import type { CatPose, CatState, PropState, Vec } from '../../types'
import { startLeap } from './leap'
import { isPerchSpotTaken } from './perch'
import { catRadius, pushOutOfPond, settleOnGround } from './queries'

const benchBackLevel = 10
const treeBranchLevel = 20
const treeTrunkLevel = 22
const basketLevel = 30

function drawScaleOf(prop: PropState, context: StepContext): number {
  return depthScale(prop.position.y, context.world.height)
}

export function sideToward(prop: PropState, point: Vec): 1 | -1 {
  return point.x < prop.position.x ? -1 : 1
}

export function besideSolid(prop: PropState, cat: CatState, context: StepContext, side: number, forward = 3): Vec {
  const reach = prop.radius + catRadius(cat) + 4
  return settleOnGround(clampToBounds({ x: prop.position.x + side * reach, y: prop.position.y + forward }, context.bounds), context, catRadius(cat))
}

export function inFrontOf(prop: PropState, cat: CatState, context: StepContext, offsetX = 0): Vec {
  const reach = prop.solid ? prop.radius + catRadius(cat) + 4 : prop.radius * 0.7 + catRadius(cat)
  return settleOnGround(clampToBounds({ x: prop.position.x + offsetX, y: prop.position.y + reach }, context.bounds), context, catRadius(cat))
}

export function ringPoint(prop: PropState, cat: CatState, context: StepContext, angle: number, extra = 4): Vec {
  const reach = prop.radius + catRadius(cat) + extra
  const point = { x: prop.position.x + Math.cos(angle) * reach, y: prop.position.y + Math.sin(angle) * reach * 0.7 }
  return clampToBounds(point, context.bounds)
}

export function pondEdge(pond: PropState, from: Vec, cat: CatState, context: StepContext): Vec {
  const direction = normalize(subtract(from, pond.position))
  const safe = length(direction) > 0.5 ? direction : { x: 0, y: 1 }
  const edge = pushOutOfPond(add(pond.position, safe), pond, catRadius(cat) + 3, { x: 0, y: 1 })
  return settleOnGround(edge, context, catRadius(cat))
}

export function benchBackSpot(bench: PropState, side: number, context: StepContext): PerchSpot {
  const drawScale = drawScaleOf(bench, context)
  return {
    propId: bench.id,
    level: side < 0 ? benchBackLevel : benchBackLevel + 1,
    spot: { x: bench.position.x + side * bench.radius * 0.35 * drawScale, y: bench.position.y - 1 },
    height: bench.perchHeight * 1.7 * drawScale,
  }
}

export function treeBranchSpot(tree: PropState, side: number, context: StepContext): PerchSpot {
  return {
    propId: tree.id,
    level: side < 0 ? treeBranchLevel : treeBranchLevel + 1,
    spot: { x: tree.position.x + side * tree.radius * 1.6 * drawScaleOf(tree, context), y: tree.position.y + 1 },
    height: hidingHeightOf(tree, context.world.height) * 0.82,
  }
}

export function treeTrunkSpot(tree: PropState, side: number, context: StepContext, height: number): PerchSpot {
  return {
    propId: tree.id,
    level: side < 0 ? treeTrunkLevel : treeTrunkLevel + 1,
    spot: { x: tree.position.x + side * tree.radius * 0.55 * drawScaleOf(tree, context), y: tree.position.y + 2 },
    height,
  }
}

export function basketSpot(basket: PropState, context: StepContext): PerchSpot {
  return { propId: basket.id, level: basketLevel, spot: { x: basket.position.x, y: basket.position.y + 1 }, height: 7 * drawScaleOf(basket, context) }
}

export function spotFree(context: StepContext, spot: PerchSpot, catId: string): boolean {
  return !isPerchSpotTaken(context, spot.propId, spot.level, catId)
}

export function mountSpot(cat: CatState, mind: CatMind, context: StepContext, spot: PerchSpot, pose: CatPose = 'jump', extraPeak = 18): void {
  mind.perch = spot
  cat.propId = spot.propId
  const rise = Math.max(0, spot.height - cat.height)
  const duration = (0.3 + rise / 500) / Math.pow(mind.personality.jumpPower, 0.3)
  startLeap(cat, mind, context, spot.spot, spot.height, extraPeak + rise * 0.25, duration, pose, 'climb')
}

export function holdSpot(cat: CatState, mind: CatMind): boolean {
  const spot = mind.perch
  if (!spot) return false
  cat.position = { x: spot.spot.x, y: spot.spot.y }
  cat.height = spot.height
  cat.velocity = { x: 0, y: 0 }
  return true
}

export function hopToGround(cat: CatState, mind: CatMind, context: StepContext, landing: Vec, pose: CatPose = 'jump'): void {
  mind.perch = null
  cat.propId = null
  const duration = 0.34 + cat.height / 650
  startLeap(cat, mind, context, landing, 0, 14, duration, pose, 'ground')
}
