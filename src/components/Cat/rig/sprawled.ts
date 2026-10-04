import { add } from '../../../game/vector'
import type { CatRig, RigInput } from './rigModel'
import { bodyToLocal, frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

function restHeadNearGround(rig: CatRig, input: RigInput, lift: number): void {
  const neck = bodyToLocal(rig, input.dimensions.neck)
  rig.headOffsetY = -input.dimensions.headRadius * lift - neck.y
}

export function applyBellyUp(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const wiggle = Math.sin(time * 4.2)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  rig.bodySquash = -0.95
  rig.bodyStretch = 1.02
  rig.bodyAngle = wiggle * 3
  rig.bodyY = -dimensions.bodyRadiusY * 0.92
  rig.bodyArch = 0.25
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * (0.35 + wiggle * 0.08), y: -reach * 0.62 }),
    add(shoulder, { x: reach * (0.12 - wiggle * 0.08), y: -reach * 0.7 }),
    add(hip, { x: -hindReach * (0.05 - wiggle * 0.1), y: -hindReach * 0.66 }),
    add(hip, { x: hindReach * (0.18 + wiggle * 0.1), y: -hindReach * 0.6 }),
  )
  restHeadNearGround(rig, input, 0.82)
  rig.headOffsetX = 3
  rig.headAngle = -24 + wiggle * 5
  rig.tailAngle = 190
  rig.tailCurl = 30 + Math.sin(time * 2.2) * 30
  rig.eyeOpen = 0.55
  rig.eyeHappy = 1
  rig.earAngle = 8
  rig.pupilDilation = 0.8
  rig.mouthOpen = 0.12
}

export function applyFlop(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  const twitchGate = Math.max(0, Math.sin(time * 2.3)) ** 6
  const twitch = Math.sin(time * 26) * twitchGate
  rig.bodyY = -dimensions.bodyRadiusY * 0.8
  rig.bodySquash = 0.9
  rig.bodyStretch = 1.08
  rig.bodyAngle = 4
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    { x: shoulder.x + reach * 0.9, y: -2 - twitch * 3 },
    { x: shoulder.x + reach * 0.75, y: -5 + twitch * 2 },
    { x: hip.x - hindReach * 0.85, y: -2 + twitch * 2 },
    { x: hip.x - hindReach * 0.7, y: -5 - twitch * 3 },
  )
  restHeadNearGround(rig, input, 0.8)
  rig.headOffsetX = 6
  rig.headAngle = 22
  rig.tailAngle = 184
  rig.tailCurl = 12 + twitch * 20
  rig.eyeOpen = 0.45
  rig.earAngle = 14
  rig.pupilDilation = 0.5
  rig.mouthOpen = 0.1
}

export function applyArch(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const legTotal = frontLegTotal(dimensions)
  const side = Math.sin(time * 3.2)
  const step = Math.max(0, Math.sin(time * 6.4))
  rig.bodyY = dimensions.standBodyY - legTotal * 0.16
  rig.bodyX = side * 2
  rig.bodyStretch = 0.86
  rig.bodySquash = 0.72
  rig.bodyArch = 1
  rig.furPuff = 1
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    { x: shoulder.x - 3, y: side > 0 ? -step * 3 : 0 },
    { x: shoulder.x - 6, y: side <= 0 ? -step * 3 : 0 },
    { x: hip.x + 5, y: side <= 0 ? -step * 3 : 0 },
    { x: hip.x + 8, y: side > 0 ? -step * 3 : 0 },
  )
  rig.headOffsetX = 2
  rig.headOffsetY = 9
  rig.headAngle = 8
  rig.tailAngle = 112
  rig.tailCurl = 34 + Math.sin(time * 5) * 10
  rig.tailPuff = 0.85
  rig.earAngle = -30
  rig.mouthOpen = 0.6
  rig.pupilDilation = 1
}

export function applyCling(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  const shimmy = Math.sin(time * 3)
  rig.bodyAngle = -80
  rig.bodyStretch = 0.94
  rig.bodyX = -4
  rig.bodyY = -dimensions.bodyRadiusX * 0.95 + shimmy * 0.6
  const { shoulder, hip } = jointsOf(rig, dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.62, y: -reach * 0.45 + shimmy }),
    add(shoulder, { x: reach * 0.7, y: -reach * 0.2 - shimmy }),
    add(hip, { x: hindReach * 0.62, y: hindReach * 0.12 }),
    add(hip, { x: hindReach * 0.7, y: hindReach * 0.32 }),
  )
  rig.headOffsetX = 2
  rig.headOffsetY = 0
  rig.headAngle = -12 + Math.sin(time * 0.8) * 6
  rig.tailAngle = 262
  rig.tailCurl = 26 + Math.sin(time * 1.5) * 16
  rig.earAngle = -6
  rig.pupilDilation = 0.95
}
