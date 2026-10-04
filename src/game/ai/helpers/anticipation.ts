import type { CatMind, LandAction } from '../../memory'
import { clamp, length } from '../../vector'
import type { CatPose, CatState } from '../../types'

const woundUpPoses = new Set<CatPose>(['crouch', 'stalk', 'reach', 'startle', 'arch', 'dangle', 'jump', 'pounce'])
const reactiveLandings = new Set<LandAction>(['startle', 'butterfly'])

export function anticipationSeconds(cat: CatState, mind: CatMind, pose: CatPose, onLand: LandAction, peak: number): number {
  if (cat.hidden || pose === 'startle' || reactiveLandings.has(onLand)) return 0
  if (woundUpPoses.has(cat.pose) || woundUpPoses.has(mind.idlePose)) return 0
  if (mind.poseLock || mind.leap) return 0
  if (cat.height > 1) return 0.06
  if (pose === 'hop') return 0.05
  const gather = 0.07 + clamp(peak, 0, 120) / 900
  const moving = length(cat.velocity) > 120 ? 0.6 : 1
  return gather * moving / Math.sqrt(Math.max(0.5, mind.personality.jumpPower))
}
