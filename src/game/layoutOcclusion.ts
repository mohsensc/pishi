import type { PropKind, Vec } from './types'

export interface Footprint {
  center: Vec
  radius: number
}

export interface TallColumn {
  base: Vec
  halfWidth: number
  reach: number
}

export interface PlacedFootprint {
  footprint: Footprint
  gap: number
  column: TallColumn | null
}

export function tallColumnOf(kind: PropKind, position: Vec, sizeScale: number): TallColumn | null {
  if (kind === 'lamppost') return { base: position, halfWidth: 22 * sizeScale, reach: 170 * sizeScale }
  if (kind === 'tree') return { base: position, halfWidth: 70 * sizeScale, reach: 200 * sizeScale }
  if (kind === 'catTree') return { base: position, halfWidth: 44 * sizeScale, reach: 130 * sizeScale }
  return null
}

export function isOccluding(column: TallColumn | null, footprint: Footprint): boolean {
  if (!column) return false
  const behind = footprint.center.y < column.base.y && footprint.center.y > column.base.y - column.reach
  return behind && Math.abs(footprint.center.x - column.base.x) < column.halfWidth + footprint.radius
}
