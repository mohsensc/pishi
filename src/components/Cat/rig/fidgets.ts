import type { CatPose } from '../../../game/types'
import type { CatRig, RigInput } from './rigModel'
import { jointsOf } from './rigModel'
import { envelope } from './springs'

type FidgetKind = 'tailFlick' | 'pawLick' | 'lookAround' | 'earTwitch' | 'shiftWeight' | 'yawn' | 'headTilt'

interface ActiveFidget {
  kind: FidgetKind
  elapsed: number
  duration: number
  side: 1 | -1
}

const fidgetDurations: Record<FidgetKind, number> = {
  tailFlick: 0.5,
  pawLick: 1.3,
  lookAround: 1.7,
  earTwitch: 0.35,
  shiftWeight: 0.7,
  yawn: 1.4,
  headTilt: 1.2,
}

const fidgetPoses = new Set<CatPose>(['sit', 'loaf', 'crouch', 'beg', 'eat', 'sniff'])
const sittingKinds: FidgetKind[] = ['tailFlick', 'pawLick', 'lookAround', 'earTwitch', 'shiftWeight', 'yawn', 'headTilt', 'lookAround', 'tailFlick']
const lyingKinds: FidgetKind[] = ['tailFlick', 'lookAround', 'earTwitch', 'yawn', 'headTilt', 'tailFlick']
const busyKinds: FidgetKind[] = ['tailFlick', 'earTwitch', 'headTilt']

function kindsFor(pose: CatPose): FidgetKind[] {
  if (pose === 'sit') return sittingKinds
  if (pose === 'loaf') return lyingKinds
  return busyKinds
}

export class FidgetScheduler {
  private active: ActiveFidget | null = null
  private cooldown = 1.2

  private readonly random: () => number

  constructor(random: () => number) {
    this.random = random
  }

  update(seconds: number, pose: CatPose, calm: boolean): number {
    if (this.active) {
      this.active.elapsed += seconds
      if (this.active.elapsed >= this.active.duration || !fidgetPoses.has(pose)) this.active = null
      return 0
    }
    if (!calm || !fidgetPoses.has(pose)) {
      this.cooldown = Math.max(this.cooldown, 0.5)
      return 0
    }
    this.cooldown -= seconds
    if (this.cooldown > 0) return 0
    const kinds = kindsFor(pose)
    const kind = kinds[Math.floor(this.random() * kinds.length) % kinds.length]
    const side = this.random() < 0.5 ? -1 : 1
    this.active = { kind, elapsed: 0, duration: fidgetDurations[kind], side }
    this.cooldown = 0.9 + this.random() * 2.4
    return kind === 'tailFlick' ? side * 260 : 0
  }

  apply(rig: CatRig, input: RigInput): void {
    const fidget = this.active
    if (!fidget) return
    const progress = fidget.elapsed / fidget.duration
    const amount = envelope(progress)
    if (fidget.kind === 'pawLick' && input.pose === 'sit') {
      const shoulder = jointsOf(rig, input.dimensions).shoulder
      const upper = input.dimensions.frontUpperLength
      const lick = Math.sin(input.time * 9)
      rig.frontNearX += (shoulder.x + upper * 0.95 - rig.frontNearX) * amount
      rig.frontNearY += (shoulder.y - upper * 0.3 + lick * amount - rig.frontNearY) * amount
      rig.headAngle += 14 * amount
      rig.headOffsetY += 4 * amount
      rig.tongue = Math.max(rig.tongue, amount * (0.4 + Math.max(0, lick) * 0.6))
      rig.eyeOpen = Math.min(rig.eyeOpen, 1 - amount * 0.8)
      return
    }
    if (fidget.kind === 'lookAround') {
      rig.headAngle += Math.sin(progress * Math.PI * 2) * 13 * fidget.side * amount
      rig.headOffsetX += Math.sin(progress * Math.PI * 2) * 1.6 * fidget.side
      return
    }
    if (fidget.kind === 'earTwitch') {
      rig.earFlickNear += 20 * amount
      rig.earFlickFar -= 14 * envelope(Math.min(1, progress * 1.4))
      return
    }
    if (fidget.kind === 'shiftWeight') {
      rig.bodyX += amount * 1.6 * fidget.side
      rig.frontFarY -= amount * 3
      rig.frontFarX += amount * 1.5
      return
    }
    if (fidget.kind === 'yawn') {
      rig.mouthOpen = Math.max(rig.mouthOpen, amount * 0.95)
      rig.eyeOpen = Math.min(rig.eyeOpen, 1 - amount)
      rig.headAngle -= 10 * amount
      rig.earAngle -= 8 * amount
      return
    }
    if (fidget.kind === 'headTilt') {
      rig.headAngle += 17 * fidget.side * Math.min(1, amount * 1.6)
      rig.pupilDilation = Math.max(rig.pupilDilation, 0.7 * amount)
    }
  }
}
