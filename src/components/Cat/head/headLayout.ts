import type { Vec } from '../../../game/types'
import type { CatDimensions } from '../breedShapes'

export interface HeadLayout {
  radius: number
  isPersian: boolean
  isMau: boolean
  headRadiusX: number
  headRadiusY: number
  eyeY: number
  backEyeCenter: Vec
  frontEyeCenter: Vec
  nose: Vec
}

const layoutCache = new WeakMap<CatDimensions, HeadLayout>()

function buildLayout(dimensions: CatDimensions): HeadLayout {
  const radius = dimensions.headRadius
  const isPersian = dimensions.breed === 'persian'
  const eyeY = isPersian ? 0.02 * radius : -0.08 * radius
  return {
    radius,
    isPersian,
    isMau: dimensions.breed === 'egyptianMau',
    headRadiusX: radius * (isPersian ? 1.12 : 1.06),
    headRadiusY: radius * (isPersian ? 0.98 : 0.93),
    eyeY,
    backEyeCenter: { x: -0.1 * radius, y: eyeY },
    frontEyeCenter: { x: 0.5 * radius, y: eyeY },
    nose: isPersian ? { x: 0.22 * radius, y: 0.3 * radius } : { x: 0.28 * radius, y: 0.3 * radius },
  }
}

export function headLayout(dimensions: CatDimensions): HeadLayout {
  const cached = layoutCache.get(dimensions)
  if (cached) return cached
  const layout = buildLayout(dimensions)
  layoutCache.set(dimensions, layout)
  return layout
}
