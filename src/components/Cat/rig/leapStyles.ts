import type { LeapStyle } from '../../../game/types'
import { add } from '../../../game/vector'
import type { CatRig, RigApplier, RigInput } from './rigModel'
import { airborneRise, frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

function applyClassicJump(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  rig.bodyAngle = -24
  rig.bodyStretch = 1.08
  rig.bodyY -= 2
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.55, y: -reach * 0.45 }),
    add(shoulder, { x: reach * 0.45, y: -reach * 0.35 }),
    add(hip, { x: -hindReach * 0.6, y: hindReach * 0.7 }),
    add(hip, { x: -hindReach * 0.5, y: hindReach * 0.75 }),
  )
  rig.headAngle = 10
  rig.headOffsetX = 2
  rig.tailAngle = 200 + Math.sin(time * 6) * 6
  rig.tailCurl = 25
  rig.earAngle = -6
  rig.pupilDilation = 0.9
}

function applyReachLeap(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const rise = airborneRise(input)
  rig.bodyAngle = -30
  rig.bodyStretch = 0.7
  rig.bodySquash = 1.45 + rise * 0.08
  rig.bodyY -= 8
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.32, y: -reach * 0.94 }),
    add(shoulder, { x: reach * 0.44, y: -reach * 0.88 }),
    add(hip, { x: hindReach * 0.1, y: hindReach * 0.95 }),
    add(hip, { x: hindReach * 0.2, y: hindReach * 0.92 }),
  )
  rig.headAngle = -26
  rig.headOffsetX = -6
  rig.headOffsetY = 11
  rig.tailAngle = 245 + Math.sin(time * 5) * 8
  rig.tailCurl = 30
  rig.earAngle = -4
  rig.pupilDilation = 1
}

function applySpringUpLeap(rig: CatRig, input: RigInput): void {
  const { dimensions } = input
  const extend = 1 - Math.max(0, airborneRise(input))
  rig.bodyAngle = -8 + extend * 4
  rig.bodySquash = 1.08 - extend * 0.08
  rig.bodyStretch = 0.9 + extend * 0.1
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  const tuckFront = { x: reach * 0.2, y: reach * 0.2 }
  const tuckHind = { x: hindReach * 0.18, y: hindReach * 0.2 }
  const stretchFront = { x: reach * 0.25, y: reach * 0.95 }
  const stretchHind = { x: -hindReach * 0.15, y: hindReach * 0.95 }
  const mixed = (tucked: { x: number; y: number }, stretched: { x: number; y: number }, shift: number) => ({
    x: tucked.x + (stretched.x - tucked.x) * extend + shift,
    y: tucked.y + (stretched.y - tucked.y) * extend,
  })
  setPaws(
    rig,
    add(shoulder, mixed(tuckFront, stretchFront, 2)),
    add(shoulder, mixed(tuckFront, stretchFront, -2)),
    add(hip, mixed(tuckHind, stretchHind, -2)),
    add(hip, mixed(tuckHind, stretchHind, 2)),
  )
  rig.headAngle = -10
  rig.tailAngle = 170 + extend * 60
  rig.tailCurl = -40 + extend * 60
  rig.earAngle = -8
  rig.pupilDilation = 1
}

function applyTwistReachLeap(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const rise = airborneRise(input)
  rig.bodyAngle = -26
  rig.bodyStretch = 0.82
  rig.bodySquash = 1.24
  rig.bodyY -= 4
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * (0.7 + rise * 0.1), y: -reach * 0.75 }),
    add(shoulder, { x: -reach * 0.1, y: reach * 0.55 }),
    add(hip, { x: -hindReach * 0.55, y: hindReach * 0.7 }),
    add(hip, { x: hindReach * 0.3, y: hindReach * 0.8 }),
  )
  rig.headAngle = 18 + Math.sin(time * 4) * 4
  rig.headOffsetX = -4
  rig.headOffsetY = 1
  rig.tailAngle = 280
  rig.tailCurl = -70
  rig.earAngle = -10
  rig.pupilDilation = 1
}

function applyDoubleHopLeap(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const bounce = Math.abs(Math.sin(time * 11))
  rig.bodyAngle = -10 + bounce * 6
  rig.bodySquash = 0.96 + bounce * 0.08
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.45, y: reach * (0.1 - bounce * 0.3) }),
    add(shoulder, { x: reach * 0.35, y: reach * (0.15 - bounce * 0.3) }),
    add(hip, { x: -hindReach * 0.2, y: hindReach * (0.85 - bounce * 0.2) }),
    add(hip, { x: -hindReach * 0.1, y: hindReach * (0.85 - bounce * 0.2) }),
  )
  rig.headAngle = -8
  rig.tailAngle = 120 + bounce * 40
  rig.tailCurl = -50
  rig.pupilDilation = 0.8
}

function applySwatLeap(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  rig.bodyAngle = -20
  rig.bodyStretch = 0.9
  rig.bodySquash = 1.12
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  const flailNear = Math.sin(time * 19)
  const flailFar = Math.sin(time * 19 + 2.4)
  setPaws(
    rig,
    add(shoulder, { x: reach * (0.82 + flailNear * 0.15), y: -reach * (0.45 + flailNear * 0.35) }),
    add(shoulder, { x: reach * (0.85 + flailFar * 0.12), y: -reach * (0.2 + flailFar * 0.35) }),
    add(hip, { x: -hindReach * 0.35, y: hindReach * 0.85 }),
    add(hip, { x: -hindReach * 0.2, y: hindReach * 0.9 }),
  )
  rig.headAngle = -14 + flailNear * 3
  rig.tailAngle = 210 + flailFar * 10
  rig.tailCurl = 40
  rig.earAngle = -12
  rig.mouthOpen = 0.35
  rig.pupilDilation = 1
}

function applyPounceHighLeap(rig: CatRig, input: RigInput): void {
  const { dimensions } = input
  const rise = airborneRise(input)
  rig.bodyAngle = -rise * 18
  rig.bodyStretch = 1.14
  rig.bodySquash = 0.94
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  const angleDown = Math.max(0, -rise)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.95, y: reach * (-0.25 + angleDown * 0.5) }),
    add(shoulder, { x: reach * 0.85, y: reach * (-0.12 + angleDown * 0.5) }),
    add(hip, { x: -hindReach * 0.9, y: hindReach * 0.3 }),
    add(hip, { x: -hindReach * 0.8, y: hindReach * 0.4 }),
  )
  rig.headOffsetX = 4
  rig.headAngle = -6 + angleDown * 16
  rig.tailAngle = 170
  rig.tailCurl = -10
  rig.earAngle = 8
  rig.mouthOpen = 0.3
  rig.pupilDilation = 1
}

export const leapAppliers: Record<LeapStyle, RigApplier> = {
  reach: applyReachLeap,
  springUp: applySpringUpLeap,
  twistReach: applyTwistReachLeap,
  doubleHop: applyDoubleHopLeap,
  swat: applySwatLeap,
  pounceHigh: applyPounceHighLeap,
}

export function applyJump(rig: CatRig, input: RigInput): void {
  if (input.leapStyle) leapAppliers[input.leapStyle](rig, input)
  else applyClassicJump(rig, input)
}

