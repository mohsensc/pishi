import type { CatAction } from '../../../game/types'
import type { CatRig, RigApplier, RigInput } from './rigModel'
import { bodyToLocal, frontLegTotal, hindLegTotal } from './rigModel'

const groundedPoses = new Set(['sit', 'loaf', 'walk', 'crouch', 'purr', 'knead', 'beg'])

function applyProud(rig: CatRig, input: RigInput): void {
  if (input.height > 2) return
  const settle = Math.min(1, input.actionAge / 0.35)
  rig.headAngle = rig.headAngle * (1 - settle) - 14 * settle
  rig.headOffsetY -= 2 * settle
  rig.eyeOpen = Math.min(rig.eyeOpen, 1 - settle * 0.9)
  rig.eyeHappy = 1
  rig.earAngle = 4
  if (groundedPoses.has(input.pose) || input.pose === 'hop') {
    rig.tailAngle = 96
    rig.tailCurl = -70 + Math.sin(input.time * 3) * 8
  }
}

function applyFlail(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  if (input.height > 2 && input.verticalSpeed < 0) {
    const shoulder = bodyToLocal(rig, dimensions.shoulder)
    const hip = bodyToLocal(rig, dimensions.hip)
    const reach = frontLegTotal(dimensions)
    const hindReach = hindLegTotal(dimensions)
    const scramble = time * 24
    rig.frontNearX = shoulder.x + reach * (0.5 + Math.sin(scramble) * 0.35)
    rig.frontNearY = shoulder.y + reach * (0.2 + Math.cos(scramble) * 0.45)
    rig.frontFarX = shoulder.x + reach * (0.4 + Math.sin(scramble + 2) * 0.35)
    rig.frontFarY = shoulder.y + reach * (0.3 + Math.cos(scramble + 2) * 0.45)
    rig.hindNearX = hip.x + hindReach * Math.sin(scramble + 1) * 0.35
    rig.hindNearY = hip.y + hindReach * (0.6 + Math.cos(scramble + 1) * 0.3)
    rig.hindFarX = hip.x + hindReach * Math.sin(scramble + 3) * 0.35
    rig.hindFarY = hip.y + hindReach * (0.6 + Math.cos(scramble + 3) * 0.3)
    rig.bodyAngle = Math.max(-30, Math.min(30, rig.bodyAngle + Math.sin(time * 9) * 6))
    rig.tailAngle = 120 + Math.sin(time * 14) * 40
    rig.tailPuff = 0.6
    rig.eyeOpen = 1
    rig.pupilDilation = 1
    rig.mouthOpen = 0.5
    rig.earAngle = -20
    return
  }
  rig.earAngle = Math.min(rig.earAngle, -14)
  rig.eyeOpen = Math.min(rig.eyeOpen, 0.6)
}

function applyShakeOff(rig: CatRig, input: RigInput): void {
  const fade = Math.max(0, 1 - input.actionAge / 1.2)
  const shake = Math.sin(input.time * 44) * fade
  rig.bodyX += shake * 1.8
  rig.bodyAngle += shake * 3
  rig.headAngle += Math.sin(input.time * 44 + 0.8) * 16 * fade
  rig.headOffsetX += shake * 1.2
  rig.furPuff = Math.max(rig.furPuff, 0.55 * fade)
  rig.tailAngle += shake * 18
  rig.earAngle = Math.sin(input.time * 44 + 1.6) * 20 * fade
  rig.eyeOpen = Math.min(rig.eyeOpen, 0.1 + (1 - fade) * 0.9)
  rig.eyeHappy = 0
}

function applyMunch(rig: CatRig, input: RigInput): void {
  const chew = Math.abs(Math.sin(input.time * 12))
  rig.mouthOpen = chew * 0.45
  rig.headOffsetY += chew * 0.8
  rig.headAngle += Math.sin(input.time * 6) * 3
  rig.eyeOpen = Math.min(rig.eyeOpen, 0.15)
  rig.eyeHappy = 1
  rig.earAngle = 5
}

function applyPurrAction(rig: CatRig, input: RigInput): void {
  const buzz = Math.sin(input.time * 46)
  rig.bodyY += buzz * 0.3
  rig.headOffsetY += buzz * 0.3
  rig.eyeOpen = 0
  rig.eyeHappy = 1
  rig.earAngle = 6
}

function applyCatnipHigh(rig: CatRig, input: RigInput): void {
  const { time } = input
  rig.headAngle += Math.sin(time * 2.4) * 16
  rig.headOffsetX += Math.sin(time * 1.7) * 2
  rig.headOffsetY += Math.sin(time * 2.4 + 1) * 1.5
  rig.eyeOpen = 0.42 + Math.sin(time * 1.3) * 0.06
  rig.eyeHappy = 0
  rig.pupilDilation = 1
  rig.tongue = Math.max(rig.tongue, 0.35 + Math.sin(time * 1.1) * 0.15)
  rig.earAngle = 10 + Math.sin(time * 1.9) * 8
  rig.tailCurl += Math.sin(time * 3.1) * 30
}

const actionAppliers: Record<CatAction, RigApplier> = {
  catchTreat: applyProud,
  catchToy: applyProud,
  missTreat: applyFlail,
  missToy: applyFlail,
  munch: applyMunch,
  shakeOff: applyShakeOff,
  purr: applyPurrAction,
  catnipHigh: applyCatnipHigh,
}

export function applyAction(rig: CatRig, input: RigInput): void {
  if (input.action) actionAppliers[input.action](rig, input)
}
