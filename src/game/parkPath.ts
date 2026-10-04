import type { Vec } from './types'

export function parkPathCenter(progress: number, width: number, height: number, lawnTop: number): Vec {
  const bottomY = height + 40
  const topY = lawnTop + 4
  const y = bottomY - progress * (bottomY - topY)
  const x = width * (0.44 + 0.2 * Math.sin(progress * 4.4 + 0.7) * (1 - progress * 0.35))
  return { x, y }
}

export function parkPathHalfWidth(progress: number, width: number): number {
  const nearWidth = Math.min(120, Math.max(70, width * 0.07))
  return (nearWidth * (1 - progress) + 10 * progress) / 2
}

function parkPathProgressAt(y: number, height: number, lawnTop: number): number {
  return 1 - (y - lawnTop - 4) / (height + 40 - lawnTop - 4)
}

export function horizontalGapToParkPath(point: Vec, width: number, height: number, lawnTop: number): number {
  const progress = parkPathProgressAt(point.y, height, lawnTop)
  if (progress < 0 || progress > 1) return Infinity
  const center = parkPathCenter(progress, width, height, lawnTop)
  return Math.abs(point.x - center.x) - parkPathHalfWidth(progress, width)
}
