import { LAWN_TOP_RATIO } from './constants'
import type { Vec } from './types'

export function toScreen(position: Vec, height: number): Vec {
  return { x: position.x, y: position.y - height }
}

export function depthScale(y: number, worldHeight: number): number {
  const lawnTop = worldHeight * LAWN_TOP_RATIO
  const span = Math.max(1, worldHeight - lawnTop)
  const depth = Math.min(1, Math.max(0, (y - lawnTop) / span))
  return 0.8 + 0.3 * depth
}
