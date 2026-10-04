import {
  COMPACT_DOCK_CLEARANCE,
  COMPACT_DOCK_WIDTH,
  LAWN_BOTTOM_MARGIN,
  LAWN_SIDE_MARGIN,
  LAWN_TOP_MARGIN,
  LAWN_TOP_RATIO,
  REFERENCE_HEIGHT,
  REFERENCE_WIDTH,
} from './constants'
import { clamp } from './vector'
import type { Vec } from './types'

export interface LawnBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export function lawnTopEdge(height: number): number {
  return height * LAWN_TOP_RATIO
}

function bottomMargin(width: number): number {
  return LAWN_BOTTOM_MARGIN + (width <= COMPACT_DOCK_WIDTH ? COMPACT_DOCK_CLEARANCE : 0)
}

export function lawnBounds(width: number, height: number, inset = 0): LawnBounds {
  return {
    left: LAWN_SIDE_MARGIN + inset,
    right: Math.max(LAWN_SIDE_MARGIN + inset + 1, width - LAWN_SIDE_MARGIN - inset),
    top: lawnTopEdge(height) + LAWN_TOP_MARGIN + inset,
    bottom: Math.max(lawnTopEdge(height) + LAWN_TOP_MARGIN + inset + 1, height - bottomMargin(width) - inset),
  }
}

const dockKeepOutRight = 108
const dockKeepOutHalfHeight = 215
const dockKeepOutFootRoom = 44

export function dockKeepOut(width: number, height: number): LawnBounds | null {
  if (width <= COMPACT_DOCK_WIDTH) return null
  return {
    left: 0,
    right: dockKeepOutRight,
    top: height / 2 - dockKeepOutHalfHeight,
    bottom: height / 2 + dockKeepOutHalfHeight + dockKeepOutFootRoom,
  }
}

export function pushOutOfDock(position: Vec, width: number, height: number): Vec {
  const zone = dockKeepOut(width, height)
  if (!zone || position.x >= zone.right || position.y < zone.top || position.y > zone.bottom) return position
  return { x: zone.right, y: position.y }
}

export function boundsCenter(bounds: LawnBounds): Vec {
  return { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 }
}

export function createLawnMapper(oldWidth: number, oldHeight: number, width: number, height: number): (point: Vec) => Vec {
  const oldBounds = lawnBounds(oldWidth, oldHeight)
  const newBounds = lawnBounds(width, height)
  return (point) => ({
    x: newBounds.left + ((point.x - oldBounds.left) / Math.max(1, oldBounds.right - oldBounds.left)) * (newBounds.right - newBounds.left),
    y: newBounds.top + ((point.y - oldBounds.top) / Math.max(1, oldBounds.bottom - oldBounds.top)) * (newBounds.bottom - newBounds.top),
  })
}

export function clampToBounds(position: Vec, bounds: LawnBounds): Vec {
  return { x: clamp(position.x, bounds.left, bounds.right), y: clamp(position.y, bounds.top, bounds.bottom) }
}

export function viewportScale(width: number, height: number): number {
  return clamp(Math.sqrt((width * height) / (REFERENCE_WIDTH * REFERENCE_HEIGHT)), 0.62, 1.15)
}

export function catSizeScale(width: number, height: number): number {
  const narrowFactor = clamp(width / 720, 0.82, 1)
  return clamp((0.55 + 0.45 * viewportScale(width, height)) * narrowFactor, 0.66, 1.05)
}
