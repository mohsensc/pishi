import type { CatBreed, CatCoat, Vec } from '../../game/types'

export interface CatDimensions {
  breed: CatBreed
  bodyRadiusX: number
  bodyRadiusY: number
  chestRadius: number
  haunchRadius: number
  headRadius: number
  frontUpperLength: number
  frontLowerLength: number
  hindUpperLength: number
  hindLowerLength: number
  frontLegWidth: number
  hindLegWidth: number
  pawRadiusX: number
  pawRadiusY: number
  tailLength: number
  tailWidth: number
  fluff: number
  earScale: number
  eyeRadiusX: number
  eyeRadiusY: number
  standBodyY: number
  standTilt: number
  shoulder: Vec
  hip: Vec
  neck: Vec
  tailBase: Vec
}

interface BreedProfile {
  bodyRadiusX: number
  bodyRadiusY: number
  headRadius: number
  frontLegTotal: number
  hindLegRatio: number
  legWidth: number
  tailLength: number
  tailWidth: number
  earScale: number
  eyeRadiusX: number
  eyeRadiusY: number
}

const breedProfiles: Record<CatBreed, BreedProfile> = {
  tuxedo: {
    bodyRadiusX: 29,
    bodyRadiusY: 15,
    headRadius: 15.5,
    frontLegTotal: 28,
    hindLegRatio: 1.08,
    legWidth: 6.4,
    tailLength: 42,
    tailWidth: 5.4,
    earScale: 1,
    eyeRadiusX: 3.5,
    eyeRadiusY: 4.2,
  },
  munchkin: {
    bodyRadiusX: 32,
    bodyRadiusY: 15,
    headRadius: 15.5,
    frontLegTotal: 28,
    hindLegRatio: 1.05,
    legWidth: 6.8,
    tailLength: 38,
    tailWidth: 5.6,
    earScale: 1,
    eyeRadiusX: 3.8,
    eyeRadiusY: 4.4,
  },
  persian: {
    bodyRadiusX: 30,
    bodyRadiusY: 18,
    headRadius: 17.5,
    frontLegTotal: 25,
    hindLegRatio: 1.04,
    legWidth: 8,
    tailLength: 38,
    tailWidth: 7,
    earScale: 0.55,
    eyeRadiusX: 4.2,
    eyeRadiusY: 4.2,
  },
  egyptianMau: {
    bodyRadiusX: 29,
    bodyRadiusY: 13.5,
    headRadius: 14.5,
    frontLegTotal: 30,
    hindLegRatio: 1.2,
    legWidth: 5.8,
    tailLength: 44,
    tailWidth: 4.8,
    earScale: 1.2,
    eyeRadiusX: 4.3,
    eyeRadiusY: 4.9,
  },
}

export function computeDimensions(coat: CatCoat): CatDimensions {
  const profile = breedProfiles[coat.breed]
  const fluff = Math.min(1, Math.max(0, coat.fluffiness))
  const legScale = Math.min(1.4, Math.max(0.35, coat.legLength))
  const bodyRadiusX = profile.bodyRadiusX + fluff * 2
  const bodyRadiusY = profile.bodyRadiusY + fluff * 2
  const frontLegTotal = profile.frontLegTotal * legScale
  const hindLegTotal = frontLegTotal * profile.hindLegRatio
  const shoulder = { x: bodyRadiusX * 0.55, y: bodyRadiusY * 0.45 }
  const hip = { x: -bodyRadiusX * 0.52, y: bodyRadiusY * 0.4 }
  const standBodyY = -(frontLegTotal * 0.94 + shoulder.y)
  const standTilt = coat.breed === 'egyptianMau' ? 3 : 0
  return {
    breed: coat.breed,
    bodyRadiusX,
    bodyRadiusY,
    chestRadius: bodyRadiusY * 0.94,
    haunchRadius: bodyRadiusY * 1.02,
    headRadius: profile.headRadius + fluff * 1.5,
    frontUpperLength: frontLegTotal * 0.52,
    frontLowerLength: frontLegTotal * 0.48,
    hindUpperLength: hindLegTotal * 0.5,
    hindLowerLength: hindLegTotal * 0.5,
    frontLegWidth: profile.legWidth + fluff * 1.5,
    hindLegWidth: profile.legWidth + 0.8 + fluff * 1.5,
    pawRadiusX: 4.2 + fluff * 0.8,
    pawRadiusY: 2.9 + fluff * 0.4,
    tailLength: profile.tailLength,
    tailWidth: profile.tailWidth + fluff * 4,
    fluff,
    earScale: profile.earScale,
    eyeRadiusX: profile.eyeRadiusX,
    eyeRadiusY: profile.eyeRadiusY,
    standBodyY,
    standTilt,
    shoulder,
    hip,
    neck: { x: bodyRadiusX * 0.9, y: -bodyRadiusY * 0.72 },
    tailBase: { x: -bodyRadiusX * 0.92, y: -bodyRadiusY * 0.25 },
  }
}
