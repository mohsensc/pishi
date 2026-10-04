import { useState } from 'react'
import type { CatPose, CatState } from '../../game/types'
import { hashToUnit } from '../../game/random'
import { happinessOf } from '../../game/happiness/happiness'
import { length } from '../../game/vector'
import type { CatDimensions } from './breedShapes'
import { blendRig, computeRig, type CatRig } from './rig/computeRig'
import { SecondaryMotion } from './rig/secondaryMotion'

const poseBlendSeconds = 0.2
const poseBlendByTarget: Partial<Record<CatPose, number>> = {
  sleep: 0.75,
  loaf: 0.45,
  purr: 0.4,
  knead: 0.35,
  sit: 0.28,
  groom: 0.3,
  bellyUp: 0.35,
  startle: 0.08,
  arch: 0.1,
  pounce: 0.1,
  jump: 0.12,
}
const maxFrameSeconds = 1 / 20
const groggyBehaviors = new Set(['groggyWake'])

function gaitRate(pose: CatPose, speed: number, dimensions: CatDimensions): number {
  const munchkinBoost = dimensions.breed === 'munchkin' ? 1.55 : 1
  if (pose === 'run') return Math.min(4.4, Math.max(2.3, 2.3 + speed / 220)) * munchkinBoost
  if (pose === 'walk') return Math.min(2.4, Math.max(1, 1 + speed / 90)) * munchkinBoost
  if (pose === 'stalk') return Math.min(1.4, Math.max(0.35, 0.35 + speed / 110)) * munchkinBoost
  return 0
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value)
}

function realSeconds(): number {
  return typeof performance === 'undefined' ? Date.now() / 1000 : performance.now() / 1000
}

interface CatRigFrame {
  rig: CatRig
  time: number
}

class CatRigAnimator {
  lastClock: number | null = null
  lastReal: number | null = null
  localTime = 0
  gaitPhase = 0
  poseKey = ''
  fromRig: CatRig | null = null
  blendElapsed = poseBlendSeconds
  blendSeconds = poseBlendSeconds
  lastRig: CatRig | null = null
  readonly secondary: SecondaryMotion

  constructor(seed: number) {
    this.secondary = new SecondaryMotion(seed)
  }

  private frameSeconds(cat: CatState): number {
    const now = realSeconds()
    const realDelta = this.lastReal === null ? 0 : Math.max(0, now - this.lastReal)
    this.lastReal = now
    const clockDelta = this.lastClock === null ? 0 : cat.clock - this.lastClock
    this.lastClock = cat.clock
    if (clockDelta < 0) return 1 / 60
    if (clockDelta === 0 && cat.pose === 'dangle') return Math.min(maxFrameSeconds, realDelta)
    return Math.min(maxFrameSeconds, clockDelta)
  }

  advance(cat: CatState, dimensions: CatDimensions, startled: boolean): CatRigFrame {
    const frameSeconds = this.frameSeconds(cat)
    this.localTime += frameSeconds
    const speed = length(cat.velocity)
    this.gaitPhase = (this.gaitPhase + frameSeconds * gaitRate(cat.pose, speed, dimensions)) % 1000
    this.secondary.update(cat, frameSeconds)
    const napping = cat.intent === 'napping' || cat.pose === 'sleep'
    const carrying = cat.heldBallId !== null
    const poseKey = `${cat.pose}|${carrying}|${napping}|${startled}|${cat.action}|${cat.leapStyle}`
    if (poseKey !== this.poseKey) {
      this.fromRig = this.lastRig
      this.blendElapsed = 0
      this.blendSeconds = startled ? 0.08 : (poseBlendByTarget[cat.pose] ?? poseBlendSeconds)
      this.poseKey = poseKey
    } else {
      this.blendElapsed += frameSeconds
    }
    const input = {
      pose: cat.pose,
      time: this.localTime,
      gaitPhase: this.gaitPhase,
      dimensions,
      carrying,
      napping,
      startled,
      leapStyle: cat.leapStyle,
      action: cat.action,
      actionAge: cat.actionAge,
      height: cat.height,
      verticalSpeed: cat.verticalSpeed,
      swing: this.secondary.swingAngle,
      affection: cat.affection,
      happiness: happinessOf(cat),
      drowsiness: cat.drowsiness ?? (groggyBehaviors.has(cat.behavior) ? 0.7 : 0),
    }
    const target = computeRig(input)
    const blendAmount = Math.min(1, this.blendElapsed / this.blendSeconds)
    const blended = this.fromRig && blendAmount < 1 ? blendRig(this.fromRig, target, easeInOut(blendAmount)) : target
    this.lastRig = blended
    const rig = { ...blended }
    this.secondary.apply(rig, input)
    return { rig, time: this.localTime }
  }
}

export function useCatRig(cat: CatState, dimensions: CatDimensions, startled: boolean): CatRigFrame {
  const [animator] = useState(() => new CatRigAnimator(hashToUnit(cat.id)))
  return animator.advance(cat, dimensions, startled)
}
