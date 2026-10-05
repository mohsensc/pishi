import { playSound } from './soundEngine'
import type { SoundCue } from './soundTypes'

const streakWindowMs = 1400
const maxStreakStep = 7
const walletPan = -0.55

let streak = 0
let lastLandingAt = Number.NEGATIVE_INFINITY
const coinCue: Partial<SoundCue> = { pan: walletPan, gain: 0.9, step: 0 }

export function playCoinLanding(): void {
  const now = performance.now()
  streak = now - lastLandingAt < streakWindowMs ? Math.min(maxStreakStep, streak + 1) : 0
  lastLandingAt = now
  coinCue.step = streak
  playSound('coin', coinCue)
}
