import type { CatRig, RigInput } from './rigModel'
import { frontLegTotal, legCycle, setPaws } from './rigModel'

function walkFourPaws(rig: CatRig, frontX: number, hindX: number, gaitPhase: number, stanceFraction: number, stride: number, lift: number): void {
  const hindNear = legCycle(gaitPhase, stanceFraction, stride, lift)
  const frontNear = legCycle(gaitPhase + 0.25, stanceFraction, stride, lift)
  const hindFar = legCycle(gaitPhase + 0.5, stanceFraction, stride, lift)
  const frontFar = legCycle(gaitPhase + 0.75, stanceFraction, stride, lift)
  setPaws(
    rig,
    { x: frontX + frontNear.x, y: frontNear.y },
    { x: frontX - 3 + frontFar.x, y: frontFar.y },
    { x: hindX + hindNear.x, y: hindNear.y },
    { x: hindX + 3 + hindFar.x, y: hindFar.y },
  )
}

export function applyWalk(rig: CatRig, input: RigInput): void {
  const { dimensions, gaitPhase } = input
  const isMunchkin = dimensions.breed === 'munchkin'
  const legTotal = frontLegTotal(dimensions)
  const stride = legTotal * (isMunchkin ? 0.75 : 0.55)
  const lift = legTotal * 0.2
  const frontX = rig.bodyX + dimensions.shoulder.x
  const hindX = rig.bodyX + dimensions.hip.x
  walkFourPaws(rig, frontX, hindX, gaitPhase, 0.6, stride, lift)
  const wave = Math.sin(gaitPhase * Math.PI * 4)
  rig.bodyY += wave * 0.7
  rig.bodyAngle += isMunchkin ? Math.sin(gaitPhase * Math.PI * 2) * 3 : 0
  rig.headOffsetY = wave * 0.8
  rig.headAngle = Math.sin(gaitPhase * Math.PI * 2) * 2
  rig.tailAngle = 128 + Math.sin(gaitPhase * Math.PI * 2) * 6
  rig.tailCurl = -55 + Math.sin(gaitPhase * Math.PI * 2 + 1) * 10
}

function applyMunchkinRun(rig: CatRig, input: RigInput): void {
  const { dimensions, gaitPhase } = input
  const legTotal = frontLegTotal(dimensions)
  const frontX = rig.bodyX + dimensions.shoulder.x
  const hindX = rig.bodyX + dimensions.hip.x
  const cycleAngle = gaitPhase * Math.PI * 2
  const stride = legTotal * 1.1
  const lift = legTotal * 0.35
  const diagonalA = legCycle(gaitPhase, 0.5, stride, lift)
  const diagonalB = legCycle(gaitPhase + 0.5, 0.5, stride, lift)
  setPaws(
    rig,
    { x: frontX + 2 + diagonalA.x, y: diagonalA.y },
    { x: frontX - 1 + diagonalB.x, y: diagonalB.y },
    { x: hindX - 1 + diagonalB.x, y: diagonalB.y },
    { x: hindX + 2 + diagonalA.x, y: diagonalA.y },
  )
  rig.bodyY += -Math.abs(Math.sin(cycleAngle)) * 2.2
  rig.bodyAngle = Math.sin(cycleAngle) * 5
  rig.headAngle = -Math.sin(cycleAngle) * 4
  rig.headOffsetY = Math.sin(cycleAngle * 2) * 0.8
  rig.tailAngle = 120 + Math.sin(cycleAngle) * 14
  rig.tailCurl = -30
  rig.earAngle = -8
  rig.pupilDilation = 0.6
}

export function applyRun(rig: CatRig, input: RigInput): void {
  if (input.dimensions.breed === 'munchkin') {
    applyMunchkinRun(rig, input)
    return
  }
  const { dimensions, gaitPhase } = input
  const legTotal = frontLegTotal(dimensions)
  const frontX = rig.bodyX + dimensions.shoulder.x
  const hindX = rig.bodyX + dimensions.hip.x
  const cycleAngle = gaitPhase * Math.PI * 2
  const stride = legTotal * 1.25
  const lift = legTotal * 0.38
  const frontNear = legCycle(gaitPhase, 0.38, stride, lift)
  const frontFar = legCycle(gaitPhase + 0.1, 0.38, stride, lift)
  const hindNear = legCycle(gaitPhase + 0.5, 0.38, stride * 1.05, lift)
  const hindFar = legCycle(gaitPhase + 0.6, 0.38, stride * 1.05, lift)
  rig.bodyStretch = 1 + Math.cos(cycleAngle) * 0.07
  rig.bodyAngle = Math.sin(cycleAngle) * 7
  rig.bodyY += -Math.max(0, Math.sin(cycleAngle + 0.6)) * 3.5 + 2
  setPaws(
    rig,
    { x: frontX + 4 + frontNear.x, y: frontNear.y },
    { x: frontX + 1 + frontFar.x, y: frontFar.y },
    { x: hindX - 3 + hindNear.x, y: hindNear.y },
    { x: hindX + hindFar.x, y: hindFar.y },
  )
  rig.headOffsetX = 2
  rig.headOffsetY = 3
  rig.headAngle = -rig.bodyAngle * 0.5 + 4
  rig.tailAngle = 168 + Math.sin(cycleAngle) * 12
  rig.tailCurl = -25 + Math.sin(cycleAngle + 1.2) * 18
  rig.earAngle = -14
  rig.pupilDilation = 0.7
}

export function applyStalk(rig: CatRig, input: RigInput): void {
  const { dimensions, gaitPhase, time } = input
  const legTotal = frontLegTotal(dimensions)
  const stride = legTotal * 0.42
  const lift = legTotal * 0.14
  rig.bodyY = dimensions.standBodyY + legTotal * 0.38
  rig.bodyAngle = 3
  rig.bodyStretch = 1.06
  const frontX = rig.bodyX + dimensions.shoulder.x + 3
  const hindX = rig.bodyX + dimensions.hip.x
  walkFourPaws(rig, frontX, hindX, gaitPhase, 0.72, stride, lift)
  rig.headOffsetX = 5
  rig.headOffsetY = 7
  rig.headAngle = -4
  rig.tailAngle = 172
  rig.tailCurl = 8 + Math.sin(time * 7) * 14
  rig.earAngle = 10
  rig.pupilDilation = 0.95
}

export function applyHop(rig: CatRig, input: RigInput): void {
  const { dimensions, time, height } = input
  const legTotal = frontLegTotal(dimensions)
  const airborne = height > 1.5
  const cycle = airborne ? Math.max(0, Math.min(1, 0.5 + input.verticalSpeed / 240)) : 0.5 + Math.sin(time * 9) * 0.5
  rig.bodyAngle = -14 + (1 - cycle) * 22
  rig.bodySquash = 0.94 + cycle * 0.1
  rig.bodyStretch = 0.96
  rig.bodyY = dimensions.standBodyY - cycle * (airborne ? 4 : 2) + (airborne ? 0 : (1 - cycle) * 3)
  const shoulderX = rig.bodyX + dimensions.shoulder.x
  const hipX = rig.bodyX + dimensions.hip.x
  const tuck = airborne ? 1 - cycle : 0
  setPaws(
    rig,
    { x: shoulderX + 5 + tuck * 4, y: airborne ? -legTotal * (0.1 + tuck * 0.2) : 0 },
    { x: shoulderX + 2 + tuck * 4, y: airborne ? -legTotal * (0.08 + tuck * 0.2) : 0 },
    { x: hipX - 4 - cycle * 4, y: airborne ? legTotal * 0.02 - tuck * 6 : 0 },
    { x: hipX - 2 - cycle * 4, y: airborne ? legTotal * 0.02 - tuck * 6 : 0 },
  )
  rig.headAngle = -6
  rig.headOffsetX = 1
  rig.tailAngle = 120 + cycle * 30
  rig.tailCurl = -60
  rig.earAngle = -4
  rig.eyeHappy = 0.6
  rig.pupilDilation = 0.6
}
