import type { Vec } from '../../game/types'
import { lawnTopEdge } from '../../game/bounds'

export interface SkyFrame {
  width: number
  horizon: number
  peak: number
}

const sunrise = 0.22
const sunset = 0.78

export function arcPoint(progress: number, frame: SkyFrame): Vec {
  const lift = Math.sin(Math.PI * Math.min(1, Math.max(0, progress)))
  return {
    x: frame.width * (0.1 + 0.8 * progress),
    y: frame.horizon - (frame.horizon - frame.peak) * lift,
  }
}

export function sunProgress(dayTime: number): number | null {
  if (dayTime < sunrise || dayTime > sunset) return null
  return (dayTime - sunrise) / (sunset - sunrise)
}

export function moonProgress(dayTime: number): number | null {
  const shifted = dayTime < 0.5 ? dayTime + 1 : dayTime
  const rise = sunset - 0.02
  const set = sunrise + 1 + 0.02
  if (shifted < rise || shifted > set) return null
  return (shifted - rise) / (set - rise)
}

export function horizonFade(progress: number): number {
  return Math.min(1, progress / 0.08, (1 - progress) / 0.08)
}

export function skyFrameOf(width: number, height: number, horizonRatio: number): SkyFrame {
  const lawnTop = lawnTopEdge(height)
  return { width, horizon: lawnTop * horizonRatio, peak: lawnTop * 0.3 }
}
