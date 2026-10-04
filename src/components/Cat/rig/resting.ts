import type { CatRig, RigInput } from './rigModel'
import { bodyToLocal, frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

export function applySit(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const stubby = dimensions.breed === 'munchkin'
  rig.bodyAngle = stubby ? -26 : -30
  rig.bodyStretch = 0.9
  rig.bodySquash = 1.12
  rig.bodyX = -4
  rig.bodyY = Math.min(-(legTotal * 0.82 + dimensions.bodyRadiusY * 0.1), -dimensions.bodyRadiusY * 1.3)
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    { x: shoulder.x + 2, y: 0 },
    { x: shoulder.x - 1, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.9, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.75, y: 0 },
  )
  rig.headAngle = Math.sin(time * 0.5) * 5
  rig.headOffsetX = -3
  rig.headOffsetY = 3
  rig.tailAngle = 228
  rig.tailCurl = 128 + Math.sin(time * 1.6) * 12
  rig.tailFront = 1
}

export function applyLoaf(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const breath = Math.sin(time * 2.1)
  rig.bodyY = -dimensions.bodyRadiusY * 0.98
  rig.bodyStretch = 1.03 - breath * 0.01
  rig.bodySquash = 1 + breath * 0.035
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const flatReach = (legLength: number, anchorY: number) => Math.sqrt(Math.max(4, (legLength * 0.96) ** 2 - anchorY * anchorY))
  const frontReach = flatReach(frontLegTotal(dimensions), shoulder.y)
  const hindReach = flatReach(hindLegTotal(dimensions), hip.y + 1) * 0.8
  setPaws(
    rig,
    { x: shoulder.x + frontReach, y: 0 },
    { x: shoulder.x + frontReach - 3, y: 0 },
    { x: hip.x + hindReach, y: -1 },
    { x: hip.x + hindReach + 2, y: -1 },
  )
  rig.headOffsetX = -3
  rig.headOffsetY = 5 + breath * 0.5
  rig.headAngle = input.napping ? 6 : 0
  rig.tailAngle = 215
  rig.tailCurl = 150
  rig.tailFront = 1
  rig.eyeOpen = input.napping ? 0 : 0.55
  rig.eyeHappy = input.napping ? 0 : 0.4
  rig.pupilDilation = 0.2
}

export function applySleep(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const breath = Math.sin(time * 1.25)
  const settle = Math.sin(time * 0.31) * 0.5 + 0.5
  rig.bodyY = -dimensions.bodyRadiusY * 0.86 - breath * 0.3
  rig.bodyX = -3
  rig.bodyAngle = -3
  rig.bodyStretch = 0.8 - breath * 0.012
  rig.bodySquash = 1.04 + breath * 0.045
  rig.bodyArch = 0.42 + breath * 0.03
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const neck = bodyToLocal(rig, dimensions.neck)
  const headRadius = dimensions.headRadius
  const chinX = shoulder.x + headRadius * 0.15
  const foldedReach = (legLength: number, anchorY: number) => Math.sqrt(Math.max(4, (legLength * 0.94) ** 2 - anchorY * anchorY))
  const frontReach = Math.min(foldedReach(frontLegTotal(dimensions), shoulder.y), headRadius * 1.25)
  const hindReach = foldedReach(hindLegTotal(dimensions), hip.y)
  setPaws(
    rig,
    { x: shoulder.x + frontReach, y: -0.5 },
    { x: shoulder.x + frontReach - 4, y: -1 },
    { x: hip.x + hindReach, y: -1 },
    { x: hip.x + hindReach - 3, y: -1.5 },
  )
  rig.headOffsetX = chinX - neck.x
  rig.headOffsetY = -headRadius * 0.82 - neck.y + breath * 0.35
  rig.headAngle = 24 + settle * 3
  rig.tailAngle = 238
  rig.tailCurl = 150 + breath * 3
  rig.tailReach = 1.12
  rig.tailFront = 1
  rig.eyeOpen = 0
  rig.eyeHappy = 0
  rig.earAngle = 18 + settle * 3
  rig.pupilDilation = 0.2
  rig.whiskerTwitch = -4
}

export function applyPurr(rig: CatRig, input: RigInput): void {
  applyLoaf(rig, input)
  const buzz = Math.sin(input.time * 46)
  rig.bodyY += buzz * 0.35
  rig.headOffsetY += buzz * 0.3 - 1
  rig.headAngle = -6 + Math.sin(input.time * 1.2) * 4
  rig.eyeOpen = 0
  rig.eyeHappy = 1
  rig.earAngle = 6
  rig.tailCurl = 150 + Math.sin(input.time * 2.4) * 8
}

export function applyKnead(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  rig.bodyY = -dimensions.bodyRadiusY * 1.05 - legTotal * 0.18
  rig.bodyAngle = -10
  rig.bodyStretch = 0.98
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const press = Math.sin(time * 5.2)
  const nearLift = Math.max(0, press) * legTotal * 0.32
  const farLift = Math.max(0, -press) * legTotal * 0.32
  setPaws(
    rig,
    { x: shoulder.x + 7, y: -nearLift },
    { x: shoulder.x + 4, y: -farLift },
    { x: hip.x + dimensions.haunchRadius * 0.9, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.8, y: 0 },
  )
  rig.headOffsetX = -2
  rig.headOffsetY = 3 + Math.abs(press) * 0.8
  rig.headAngle = 4 + press * 2
  rig.tailAngle = 205
  rig.tailCurl = 120
  rig.tailFront = 1
  rig.eyeOpen = 0.1
  rig.eyeHappy = 1
  rig.earAngle = 4
}

export function applyGroom(rig: CatRig, input: RigInput): void {
  applySit(rig, input)
  const { dimensions, time } = input
  const lick = Math.sin(time * 7)
  const shoulder = jointsOf(rig, dimensions).shoulder
  const upper = dimensions.frontUpperLength
  rig.frontNearX = shoulder.x + upper * 0.95
  rig.frontNearY = shoulder.y - upper * 0.35 + lick * 1.2
  rig.headAngle = 16 + lick * 5
  rig.headOffsetX = -1
  rig.headOffsetY = 6 + lick * 0.8
  rig.tongue = 0.5 + Math.max(0, lick) * 0.5
  rig.eyeOpen = 0.12
  rig.eyeHappy = 1
  rig.earAngle = 3
}

export function applyBeg(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const sway = Math.sin(time * 2.6)
  rig.bodyAngle = -30 + sway * 1.5
  rig.bodyStretch = 0.66
  rig.bodySquash = 1.45
  rig.bodyX = -5
  rig.bodyY = -dimensions.bodyRadiusY * 1.55 - legTotal * 0.35
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const paddle = Math.sin(time * 6.5) * 1.5
  setPaws(
    rig,
    { x: shoulder.x + legTotal * 0.36, y: shoulder.y + legTotal * 0.22 + paddle },
    { x: shoulder.x + legTotal * 0.3, y: shoulder.y + legTotal * 0.26 - paddle },
    { x: hip.x + dimensions.haunchRadius * 1.1, y: 0 },
    { x: hip.x + dimensions.haunchRadius * 0.95, y: 0 },
  )
  rig.headOffsetX = -2
  rig.headOffsetY = 2
  rig.headAngle = -12 + sway * 3
  rig.tailAngle = 200
  rig.tailCurl = 90 + Math.sin(time * 3) * 20
  rig.earAngle = -4
  rig.pupilDilation = 0.95
}

export function applyPeek(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  rig.bodyOpacity = 0
  rig.bodyY = -dimensions.bodyRadiusY * 0.4
  rig.bodyX = -dimensions.bodyRadiusX * 0.2
  rig.bodyStretch = 0.9
  const shoulder = jointsOf(rig, dimensions).shoulder
  const shuffle = Math.sin(time * 1.7)
  setPaws(
    rig,
    { x: shoulder.x + 10 + shuffle, y: 0 },
    { x: shoulder.x + 4 - shuffle, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  )
  rig.headOffsetX = 2
  rig.headOffsetY = 6
  rig.headAngle = Math.sin(time * 0.9) * 8
  rig.earAngle = -2
  rig.pupilDilation = 0.9
}
