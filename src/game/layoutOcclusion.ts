import { depthScale } from './projection'
import type { PropState, Vec } from './types'

export const CANOPY_DEPTH_OFFSET = 400

export interface CanopyEllipse {
  center: Vec
  radiusX: number
  radiusY: number
}

const canopyRise = 6.4
const canopySpanX = 3.2
const canopySpanY = 2.7

export function canopyEllipseOf(tree: PropState, worldHeight: number): CanopyEllipse {
  const drawScale = depthScale(tree.position.y, worldHeight)
  return {
    center: { x: tree.position.x, y: tree.position.y - tree.radius * canopyRise * drawScale },
    radiusX: tree.radius * canopySpanX * drawScale,
    radiusY: tree.radius * canopySpanY * drawScale,
  }
}

export function canopyReach(canopy: CanopyEllipse, screenPoint: Vec): number {
  return Math.hypot((screenPoint.x - canopy.center.x) / canopy.radiusX, (screenPoint.y - canopy.center.y) / canopy.radiusY)
}

export function isBehindCanopy(tree: PropState, screenPoint: Vec, groundY: number, worldHeight: number, margin = 0.85): boolean {
  if (tree.kind !== 'tree' || groundY >= tree.position.y + CANOPY_DEPTH_OFFSET) return false
  return canopyReach(canopyEllipseOf(tree, worldHeight), screenPoint) < margin
}

export function isUnderCanopy(props: readonly PropState[], point: Vec, worldHeight: number, height = 0, margin = 0.85): boolean {
  const screenPoint = { x: point.x, y: point.y - height }
  return props.some((prop) => isBehindCanopy(prop, screenPoint, point.y, worldHeight, margin))
}
