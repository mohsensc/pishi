import type { CatCoat } from '../../game/types'
import { darken, lighten, luminance, mixColors } from './catColors'

export interface CoatPalette {
  farFur: string
  farSock: string
  backEar: string
  line: string
  whisker: string
  muzzle: string
  nose: string
  mouthLine: string
  bodyHighlight: string
  headHighlight: string
  belly: string
  underShade: string
  chestTuft: string
  chinTuft: string
  irisGlow: string
  facialMark: string
  innerEar: string
}

const paletteCache = new WeakMap<CatCoat, CoatPalette>()

function buildPalette(coat: CatCoat): CoatPalette {
  const darkCoat = luminance(coat.baseColor) < 0.35
  const bicolored = coat.pattern === 'tuxedo' || coat.pattern === 'bicolor'
  return {
    farFur: darken(coat.baseColor, 0.22),
    farSock: mixColors(coat.patchColor, coat.baseColor, 0.2),
    backEar: darken(coat.baseColor, 0.08),
    line: darkCoat ? '#0d0a09' : darken(coat.baseColor, 0.62),
    whisker: darkCoat ? '#f3eee4' : '#8d8277',
    muzzle: coat.whiteMuzzle ? coat.patchColor : lighten(coat.baseColor, darkCoat ? 0.08 : 0.28),
    nose: luminance(coat.baseColor) > 0.2 || coat.whiteMuzzle ? '#e98a97' : '#b86a77',
    mouthLine: coat.whiteMuzzle ? '#8b7d74' : darkCoat ? '#0d0a09' : darken(coat.baseColor, 0.62),
    bodyHighlight: lighten(coat.baseColor, darkCoat ? 0.1 : 0.16),
    headHighlight: lighten(coat.baseColor, darkCoat ? 0.12 : 0.18),
    belly: bicolored ? coat.patchColor : lighten(coat.baseColor, 0.3),
    underShade: darken(coat.baseColor, 0.5),
    chestTuft: bicolored ? coat.patchColor : lighten(coat.baseColor, 0.18),
    chinTuft: coat.whiteMuzzle ? coat.patchColor : lighten(coat.baseColor, 0.1),
    irisGlow: lighten(coat.eyeColor, 0.42),
    facialMark: darken(coat.baseColor, 0.55),
    innerEar: darkCoat ? '#e795a0' : '#eea3a7',
  }
}

export function coatPalette(coat: CatCoat): CoatPalette {
  const cached = paletteCache.get(coat)
  if (cached) return cached
  const palette = buildPalette(coat)
  paletteCache.set(coat, palette)
  return palette
}
