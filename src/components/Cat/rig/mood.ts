import type { CatPose } from '../../../game/types'
import type { CatRig, RigInput } from './rigModel'

const proudTailPoses = new Set<CatPose>(['walk', 'sit', 'sniff'])
const happyStart = 0.55
const unhappyStart = 0.35

function smooth(value: number): number {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped * clamped * (3 - 2 * clamped)
}

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

export function applyMood(rig: CatRig, input: RigInput): void {
  if (input.napping || input.startled || input.drowsiness > 0.4) return
  const joy = smooth((input.happiness - happyStart) / (1 - happyStart))
  const gloom = smooth((unhappyStart - input.happiness) / unhappyStart)
  if (proudTailPoses.has(input.pose)) {
    const lift = input.pose === 'sit' ? joy * 0.85 : joy
    const sway = Math.sin(input.time * 2.2) * 6 * joy
    rig.tailAngle = mix(rig.tailAngle, 98 + sway, lift)
    rig.tailCurl = mix(rig.tailCurl, -62, lift)
    if (lift > 0.5) rig.tailFront = 0
    if (input.pose !== 'sit') rig.tailAngle = mix(rig.tailAngle, 176, gloom * 0.8)
  }
  rig.eyeHappy = Math.max(rig.eyeHappy, joy * 0.22)
  rig.earAngle -= gloom * 9
  rig.headOffsetY += gloom * 1.2
}
