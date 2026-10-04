import type { LawnBounds } from '../bounds'
import { add, distance, lerpVec, scale, subtract } from '../vector'
import type { PropState, Vec } from '../types'

interface Footprint {
  center: Vec
  radius: number
}

const ringStep = 14
const ringCount = 28
const anglesPerRing = 18

function footprintOf(prop: PropState, position: Vec = prop.position): Footprint {
  if (!prop.tunnelExit) return { center: position, radius: prop.radius }
  const exit = add(prop.tunnelExit, subtract(position, prop.position))
  return { center: lerpVec(position, exit, 0.5), radius: distance(position, exit) / 2 + prop.radius }
}

function spacingFor(prop: PropState, other: PropState, sizeScale: number): number {
  const flat = (candidate: PropState) => !candidate.solid && candidate.kind !== 'pond' && !candidate.tunnelExit
  return flat(prop) && flat(other) ? 0 : 6 * sizeScale
}

function overlapsOthers(prop: PropState, position: Vec, others: PropState[], sizeScale: number): boolean {
  const footprint = footprintOf(prop, position)
  return others.some((other) => {
    const otherFootprint = footprintOf(other)
    const reach = footprint.radius + otherFootprint.radius + spacingFor(prop, other, sizeScale)
    return distance(footprint.center, otherFootprint.center) < reach
  })
}

function keepInside(prop: PropState, position: Vec, bounds: LawnBounds): Vec {
  const footprint = footprintOf(prop, position)
  const margin = Math.min(footprint.radius * 0.6, 40)
  const offset = subtract(footprint.center, position)
  const minX = bounds.left + margin
  const maxX = Math.max(minX, bounds.right - margin)
  const minY = bounds.top + margin * 0.5
  const maxY = Math.max(minY, bounds.bottom - margin * 0.5)
  const center = { x: Math.min(maxX, Math.max(minX, footprint.center.x)), y: Math.min(maxY, Math.max(minY, footprint.center.y)) }
  return subtract(center, offset)
}

export function freeSpotFor(prop: PropState, wanted: Vec, props: PropState[], bounds: LawnBounds, sizeScale: number): Vec {
  const others = props.filter((other) => other.id !== prop.id)
  const start = keepInside(prop, wanted, bounds)
  if (!overlapsOthers(prop, start, others, sizeScale)) return start
  for (let ring = 1; ring <= ringCount; ring += 1) {
    const reach = ring * ringStep * Math.max(0.7, sizeScale)
    let best: Vec | null = null
    let bestGap = Number.POSITIVE_INFINITY
    for (let step = 0; step < anglesPerRing; step += 1) {
      const angle = (step / anglesPerRing) * Math.PI * 2 + ring * 0.37
      const candidate = keepInside(prop, add(start, scale({ x: Math.cos(angle), y: Math.sin(angle) * 0.8 }, reach)), bounds)
      if (overlapsOthers(prop, candidate, others, sizeScale)) continue
      const gap = distance(candidate, wanted)
      if (gap < bestGap) {
        bestGap = gap
        best = candidate
      }
    }
    if (best) return best
  }
  return start
}
