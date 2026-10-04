import type { Vec } from './types'

export function add(first: Vec, second: Vec): Vec {
  return { x: first.x + second.x, y: first.y + second.y }
}

export function subtract(first: Vec, second: Vec): Vec {
  return { x: first.x - second.x, y: first.y - second.y }
}

export function scale(value: Vec, factor: number): Vec {
  return { x: value.x * factor, y: value.y * factor }
}

export function length(value: Vec): number {
  return Math.hypot(value.x, value.y)
}

export function distance(first: Vec, second: Vec): number {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

export function normalize(value: Vec): Vec {
  const size = length(value)
  if (size < 1e-6) return { x: 0, y: 0 }
  return { x: value.x / size, y: value.y / size }
}

export function limit(value: Vec, maximum: number): Vec {
  const size = length(value)
  if (size <= maximum || size < 1e-6) return value
  return { x: (value.x / size) * maximum, y: (value.y / size) * maximum }
}

export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount
}

export function lerpVec(start: Vec, end: Vec, amount: number): Vec {
  return { x: lerp(start.x, end.x, amount), y: lerp(start.y, end.y, amount) }
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return value < minimum ? minimum : value > maximum ? maximum : value
}

export function dot(first: Vec, second: Vec): number {
  return first.x * second.x + first.y * second.y
}

export function perpendicular(value: Vec): Vec {
  return { x: -value.y, y: value.x }
}

export function rotate(value: Vec, degrees: number): Vec {
  const radians = (degrees * Math.PI) / 180
  const cosine = Math.cos(radians)
  const sine = Math.sin(radians)
  return { x: value.x * cosine - value.y * sine, y: value.x * sine + value.y * cosine }
}

export function closestOnSegment(point: Vec, start: Vec, end: Vec): Vec {
  const segment = subtract(end, start)
  const span = dot(segment, segment)
  if (span < 1e-6) return start
  const amount = clamp(dot(subtract(point, start), segment) / span, 0, 1)
  return add(start, scale(segment, amount))
}

export function distanceToSegment(point: Vec, start: Vec, end: Vec): number {
  return distance(point, closestOnSegment(point, start, end))
}

export function isFiniteVec(value: Vec): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y)
}

export function pointToward(origin: Vec, target: Vec, amount: number): Vec {
  return add(origin, scale(normalize(subtract(target, origin)), amount))
}
