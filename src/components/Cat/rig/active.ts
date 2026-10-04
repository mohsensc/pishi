import { add } from '../../../game/vector'
import type { CatRig, RigInput } from './rigModel'
import { frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

export function applyCrouch(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const wiggle = Math.sin(time * 11)
  rig.bodyY = -(legTotal * 0.42 + dimensions.shoulder.y)
  rig.bodyAngle = 4 - wiggle * 2.5
  rig.bodyX = wiggle * 0.8 - 2
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(rig, { x: shoulder.x + 8, y: 0 }, { x: shoulder.x + 5, y: 0 }, { x: hip.x + 3, y: 0 }, { x: hip.x + 6, y: 0 })
  rig.headOffsetX = 3
  rig.headOffsetY = 7
  rig.headAngle = -2
  rig.tailAngle = 178
  rig.tailCurl = Math.sin(time * 8) * 35 - 10
  rig.earAngle = 8
  rig.pupilDilation = 1
}

export function applyBat(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  rig.bodyAngle = -26
  rig.bodyX = -3
  rig.bodyY = -(legTotal * 0.88 + dimensions.bodyRadiusY * 0.2)
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const swipe = Math.sin(time * 10)
  setPaws(
    rig,
    add(shoulder, { x: legTotal * (0.55 + swipe * 0.35), y: legTotal * (0.1 - Math.abs(swipe) * 0.25) }),
    { x: shoulder.x, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.7, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.55, y: 0 },
  )
  rig.headAngle = 6 + swipe * 3
  rig.headOffsetX = -1
  rig.headOffsetY = 2
  rig.tailAngle = 200
  rig.tailCurl = 70 + Math.sin(time * 5) * 20
  rig.earAngle = 6
  rig.pupilDilation = 0.95
}

export function applyStretch(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  rig.bodyAngle = 17
  rig.bodyStretch = 1.12
  rig.bodyY = dimensions.standBodyY + 2
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    { x: shoulder.x + legTotal * 0.85, y: 0 },
    { x: shoulder.x + legTotal * 0.7, y: 0 },
    { x: hip.x + 1, y: 0 },
    { x: hip.x + 4, y: 0 },
  )
  rig.headOffsetX = 3
  rig.headOffsetY = 8
  rig.headAngle = -18
  rig.tailAngle = 100
  rig.tailCurl = -35
  rig.eyeOpen = 0.15
  rig.eyeHappy = 1
  rig.mouthOpen = Math.max(0, Math.sin(time * 1.2)) * 0.9
  rig.earAngle = -10
}

function applyUpright(rig: CatRig, input: RigInput, lean: number): void {
  const { dimensions } = input
  const legTotal = frontLegTotal(dimensions)
  rig.bodyAngle = -30
  rig.bodyStretch = 0.62
  rig.bodySquash = 1.62
  rig.bodyX = -6 + lean
  rig.bodyY = 0
  const hipOffset = jointsOf(rig, dimensions).hip.y
  rig.bodyY = -hindLegTotal(dimensions) * 0.74 - hipOffset - legTotal * 0.05
  const hip = jointsOf(rig, dimensions).hip
  rig.hindNearX = hip.x + 3
  rig.hindNearY = 0
  rig.hindFarX = hip.x + 10
  rig.hindFarY = 0
}

export function applyReach(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  applyUpright(rig, input, 0)
  const legTotal = frontLegTotal(dimensions)
  const stretch = Math.sin(time * 3.4)
  rig.bodySquash += stretch * 0.04
  const shoulder = jointsOf(rig, dimensions).shoulder
  rig.frontNearX = shoulder.x + legTotal * 0.3
  rig.frontNearY = shoulder.y - legTotal * (0.94 + stretch * 0.03)
  rig.frontFarX = shoulder.x + legTotal * 0.42
  rig.frontFarY = shoulder.y - legTotal * (0.88 - stretch * 0.03)
  rig.headOffsetX = -6
  rig.headOffsetY = 11
  rig.headAngle = -26
  rig.tailAngle = 190
  rig.tailCurl = 40 + stretch * 12
  rig.earAngle = -4
  rig.pupilDilation = 1
}

export function applyScratch(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  applyUpright(rig, input, 4)
  rig.bodyStretch = 0.74
  rig.bodySquash = 1.45
  const legTotal = frontLegTotal(dimensions)
  const shoulder = jointsOf(rig, dimensions).shoulder
  const rake = time * 6.5
  const nearDrop = (Math.sin(rake) + 1) * 0.5
  const farDrop = (Math.sin(rake + Math.PI) + 1) * 0.5
  rig.frontNearX = shoulder.x + legTotal * 0.78
  rig.frontNearY = shoulder.y - legTotal * (0.55 - nearDrop * 0.45)
  rig.frontFarX = shoulder.x + legTotal * 0.74
  rig.frontFarY = shoulder.y - legTotal * (0.55 - farDrop * 0.45)
  rig.headOffsetX = 1
  rig.headOffsetY = 3
  rig.headAngle = -6
  rig.tailAngle = 150
  rig.tailCurl = -60 + Math.sin(time * 2) * 10
  rig.eyeOpen = 0.35
  rig.eyeHappy = 1
  rig.earAngle = 6
}

export function applyWrestle(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  rig.bodyAngle = -24 + Math.sin(time * 4) * 3
  rig.bodyStretch = 0.82
  rig.bodySquash = 1.2
  rig.bodyX = -4
  rig.bodyY = -dimensions.bodyRadiusY * 1.4 - legTotal * 0.6
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const batNear = Math.sin(time * 13)
  const batFar = Math.sin(time * 13 + 2.1)
  setPaws(
    rig,
    { x: shoulder.x + legTotal * (0.6 + batNear * 0.25), y: shoulder.y - legTotal * (0.3 + batNear * 0.3) },
    { x: shoulder.x + legTotal * (0.55 + batFar * 0.25), y: shoulder.y - legTotal * (0.2 + batFar * 0.3) },
    { x: hip.x + 6, y: 0 },
    { x: hip.x + 10, y: 0 },
  )
  rig.headOffsetX = -1
  rig.headOffsetY = 4
  rig.headAngle = 8 + batNear * 4
  rig.tailAngle = 180
  rig.tailCurl = Math.sin(time * 6) * 40
  rig.earAngle = -16
  rig.mouthOpen = 0.45 + Math.abs(batFar) * 0.3
  rig.pupilDilation = 1
}

export function applyTug(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const yank = Math.sin(time * 9)
  rig.bodyAngle = 12 + yank * 2
  rig.bodyX = -6 + yank * 1.2
  rig.bodyY = dimensions.standBodyY + legTotal * 0.3
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    { x: shoulder.x + legTotal * 0.75, y: 0 },
    { x: shoulder.x + legTotal * 0.6, y: 0 },
    { x: hip.x + legTotal * 0.15, y: 0 },
    { x: hip.x + legTotal * 0.3, y: 0 },
  )
  rig.headOffsetX = 5
  rig.headOffsetY = 9
  rig.headAngle = -8 + Math.sin(time * 14) * 9
  rig.tailAngle = 165
  rig.tailCurl = Math.sin(time * 7) * 30
  rig.earAngle = -18
  rig.eyeOpen = 0.8
  rig.pupilDilation = 1
}

export function applySniff(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const twitch = Math.sin(time * 22) * 0.6
  rig.bodyAngle = 9
  rig.bodyY = dimensions.standBodyY + legTotal * 0.08
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(rig, { x: shoulder.x + 3, y: 0 }, { x: shoulder.x, y: 0 }, { x: hip.x - 1, y: 0 }, { x: hip.x + 3, y: 0 })
  rig.headOffsetX = 5 + twitch
  rig.headOffsetY = 12 + Math.sin(time * 2.1) * 1.5
  rig.headAngle = 24 + Math.sin(time * 1.4) * 6
  rig.tailAngle = 120
  rig.tailCurl = -70 + Math.sin(time * 1.5) * 10
  rig.earAngle = 6
  rig.pupilDilation = 0.6
}

export function applyEat(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const bob = Math.sin(time * 5)
  rig.bodyAngle = 12
  rig.bodyY = dimensions.standBodyY + legTotal * 0.22
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(rig, { x: shoulder.x + 1, y: 0 }, { x: shoulder.x - 2, y: 0 }, { x: hip.x + 4, y: 0 }, { x: hip.x + 7, y: 0 })
  rig.headOffsetX = 4
  rig.headOffsetY = 14 + bob * 1.4
  rig.headAngle = 30 + bob * 4
  rig.tailAngle = 190
  rig.tailCurl = 90
  rig.tailFront = 0
  rig.mouthOpen = Math.abs(Math.sin(time * 11)) * 0.5
  rig.eyeOpen = 0.2
  rig.eyeHappy = 1
  rig.earAngle = 4
}
