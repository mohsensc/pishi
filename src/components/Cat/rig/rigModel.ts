import type { CatAction, CatPose, LeapStyle, Vec } from '../../../game/types'
import { rotate } from '../../../game/vector'
import type { CatDimensions } from '../breedShapes'

export interface CatRig {
  bodyX: number
  bodyY: number
  bodyAngle: number
  bodyStretch: number
  bodySquash: number
  bodyOpacity: number
  bodyArch: number
  furPuff: number
  headOffsetX: number
  headOffsetY: number
  headAngle: number
  tailAngle: number
  tailCurl: number
  tailPuff: number
  tailFront: number
  tailReach: number
  frontNearX: number
  frontNearY: number
  frontFarX: number
  frontFarY: number
  hindNearX: number
  hindNearY: number
  hindFarX: number
  hindFarY: number
  earAngle: number
  eyeOpen: number
  eyeHappy: number
  pupilDilation: number
  mouthOpen: number
  tongue: number
  whiskerTwitch: number
  earFlickNear: number
  earFlickFar: number
}

export interface RigInput {
  pose: CatPose
  time: number
  gaitPhase: number
  dimensions: CatDimensions
  carrying: boolean
  napping: boolean
  startled: boolean
  leapStyle: LeapStyle | null
  action: CatAction | null
  actionAge: number
  height: number
  verticalSpeed: number
  swing: number
  affection: number
  drowsiness: number
  happiness: number
}

export type RigApplier = (rig: CatRig, input: RigInput) => void

export function bodyToLocal(rig: CatRig, point: Vec): Vec {
  const scaled = { x: point.x * rig.bodyStretch, y: point.y * rig.bodySquash }
  const rotated = rotate(scaled, rig.bodyAngle)
  return { x: rotated.x + rig.bodyX, y: rotated.y + rig.bodyY }
}

export function legCycle(cycle: number, stanceFraction: number, stride: number, lift: number): Vec {
  const unit = cycle - Math.floor(cycle)
  if (unit < stanceFraction) return { x: stride * (0.5 - unit / stanceFraction), y: 0 }
  const swing = (unit - stanceFraction) / (1 - stanceFraction)
  return { x: stride * (swing - 0.5), y: -lift * Math.sin(Math.PI * swing) }
}

export function frontLegTotal(dimensions: CatDimensions): number {
  return dimensions.frontUpperLength + dimensions.frontLowerLength
}

export function hindLegTotal(dimensions: CatDimensions): number {
  return dimensions.hindUpperLength + dimensions.hindLowerLength
}

export function airborneRise(input: RigInput): number {
  return Math.max(-1, Math.min(1, input.verticalSpeed / 160))
}

export function baseRig(dimensions: CatDimensions): CatRig {
  const frontX = dimensions.shoulder.x
  const hindX = dimensions.hip.x
  return {
    bodyX: 0,
    bodyY: dimensions.standBodyY,
    bodyAngle: dimensions.standTilt,
    bodyStretch: 1,
    bodySquash: 1,
    bodyOpacity: 1,
    bodyArch: 0,
    furPuff: 0,
    headOffsetX: 0,
    headOffsetY: 0,
    headAngle: 0,
    tailAngle: 140,
    tailCurl: -40,
    tailPuff: 0,
    tailFront: 0,
    tailReach: 1,
    frontNearX: frontX + 1,
    frontNearY: 0,
    frontFarX: frontX - 3,
    frontFarY: 0,
    hindNearX: hindX - 1,
    hindNearY: 0,
    hindFarX: hindX + 3,
    hindFarY: 0,
    earAngle: 0,
    eyeOpen: 1,
    eyeHappy: 0,
    pupilDilation: 0.35,
    mouthOpen: 0,
    tongue: 0,
    whiskerTwitch: 0,
    earFlickNear: 0,
    earFlickFar: 0,
  }
}

export function setPaws(rig: CatRig, frontNear: Vec, frontFar: Vec, hindNear: Vec, hindFar: Vec): void {
  rig.frontNearX = frontNear.x
  rig.frontNearY = frontNear.y
  rig.frontFarX = frontFar.x
  rig.frontFarY = frontFar.y
  rig.hindNearX = hindNear.x
  rig.hindNearY = hindNear.y
  rig.hindFarX = hindFar.x
  rig.hindFarY = hindFar.y
}

export function jointsOf(rig: CatRig, dimensions: CatDimensions): { shoulder: Vec; hip: Vec } {
  return { shoulder: bodyToLocal(rig, dimensions.shoulder), hip: bodyToLocal(rig, dimensions.hip) }
}

export function blendRig(previous: CatRig, target: CatRig, amount: number): CatRig {
  const blended = { ...target }
  const keys = Object.keys(target) as (keyof CatRig)[]
  for (const key of keys) {
    blended[key] = previous[key] + (target[key] - previous[key]) * amount
  }
  return blended
}
