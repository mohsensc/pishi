import { rotate } from '../../../game/vector'
import type { CatRig, RigInput } from './rigModel'
import { frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

const hangAngle = -68
const scruffPoint = { x: 3, y: -26 }

function hangingPaw(joint: { x: number; y: number }, reach: number, lagDegrees: number, forward: number) {
  const radians = (lagDegrees * Math.PI) / 180
  return { x: joint.x + Math.sin(radians) * reach + forward, y: joint.y + Math.cos(radians) * reach }
}

function applyMood(rig: CatRig, input: RigInput): void {
  const { affection, time } = input
  if (affection > 0.55) {
    rig.eyeOpen = 0.3
    rig.eyeHappy = 0.9
    rig.earAngle = 5
    rig.pupilDilation = 0.3
    return
  }
  if (affection < 0.3) {
    const grumble = Math.max(0, Math.sin(time * 1.9)) ** 8
    rig.eyeOpen = 0.75
    rig.earAngle = -22
    rig.pupilDilation = 0.75
    rig.mouthOpen = grumble * 0.4
    return
  }
  rig.eyeOpen = 0.85
  rig.earAngle = -6
  rig.pupilDilation = 0.55
}

export function applyDangle(rig: CatRig, input: RigInput): void {
  const { dimensions, time, swing } = input
  rig.bodyAngle = hangAngle + swing * 0.55
  rig.bodyStretch = 1.12
  rig.bodySquash = 0.9
  const neck = rotate({ x: dimensions.neck.x * rig.bodyStretch, y: dimensions.neck.y * rig.bodySquash }, rig.bodyAngle)
  rig.bodyX = scruffPoint.x - neck.x
  rig.bodyY = scruffPoint.y - neck.y
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions) * 0.9
  const hindReach = hindLegTotal(dimensions) * 0.93
  const legLag = -swing * 0.8
  const paddle = Math.sin(time * 1.4) * 3
  setPaws(
    rig,
    hangingPaw(shoulder, reach, legLag + 8 + paddle, 3),
    hangingPaw(shoulder, reach * 0.96, legLag + 3 - paddle, 1),
    hangingPaw(hip, hindReach, legLag - 2 + paddle * 0.6, 0),
    hangingPaw(hip, hindReach * 0.97, legLag + 4 - paddle * 0.6, 2),
  )
  rig.headOffsetX = 2
  rig.headOffsetY = -3
  rig.headAngle = 10 + Math.sin(time * 1.1) * 5 - swing * 0.2
  rig.tailAngle = 262 + swing * 1.4
  rig.tailCurl = 22 + Math.sin(time * 1.6) * 12 - swing * 0.8
  rig.tailFront = 0
  rig.furPuff = 0
  applyMood(rig, input)
}
