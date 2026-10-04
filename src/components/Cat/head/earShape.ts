import type { Vec } from '../../../game/types'
import type { CatDimensions } from '../breedShapes'

export interface EarShape {
  baseStart: Vec
  baseEnd: Vec
  tip: Vec
}

export function scaleEar(ear: EarShape, scale: number): EarShape {
  const baseMiddle = { x: (ear.baseStart.x + ear.baseEnd.x) / 2, y: (ear.baseStart.y + ear.baseEnd.y) / 2 }
  const widthScale = Math.sqrt(scale)
  const scaleFromMiddle = (point: Vec, factor: number) => ({
    x: baseMiddle.x + (point.x - baseMiddle.x) * factor,
    y: baseMiddle.y + (point.y - baseMiddle.y) * factor,
  })
  return {
    baseStart: scaleFromMiddle(ear.baseStart, widthScale),
    baseEnd: scaleFromMiddle(ear.baseEnd, widthScale),
    tip: scaleFromMiddle(ear.tip, scale),
  }
}

interface EarPair {
  backEar: EarShape
  frontEar: EarShape
}

const earPairCache = new WeakMap<CatDimensions, EarPair>()

function buildEarPair(dimensions: CatDimensions): EarPair {
  const radius = dimensions.headRadius
  const isPersian = dimensions.breed === 'persian'
  const backEar = isPersian
    ? { baseStart: { x: -0.98 * radius, y: -0.3 * radius }, baseEnd: { x: -0.35 * radius, y: -0.88 * radius }, tip: { x: -1.05 * radius, y: -1.4 * radius } }
    : { baseStart: { x: -0.9 * radius, y: -0.38 * radius }, baseEnd: { x: -0.2 * radius, y: -0.9 * radius }, tip: { x: -0.8 * radius, y: -1.45 * radius } }
  const frontEar = isPersian
    ? { baseStart: { x: 0.28 * radius, y: -0.93 * radius }, baseEnd: { x: 0.95 * radius, y: -0.42 * radius }, tip: { x: 0.95 * radius, y: -1.45 * radius } }
    : { baseStart: { x: 0.1 * radius, y: -0.95 * radius }, baseEnd: { x: 0.82 * radius, y: -0.52 * radius }, tip: { x: 0.62 * radius, y: -1.48 * radius } }
  return { backEar: scaleEar(backEar, dimensions.earScale), frontEar: scaleEar(frontEar, dimensions.earScale) }
}

export function earShapesFor(dimensions: CatDimensions): EarPair {
  const cached = earPairCache.get(dimensions)
  if (cached) return cached
  const pair = buildEarPair(dimensions)
  earPairCache.set(dimensions, pair)
  return pair
}
