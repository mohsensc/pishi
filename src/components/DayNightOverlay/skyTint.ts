type Rgb = [number, number, number]

interface TintStop {
  at: number
  color: Rgb
  strength: number
}

const nightBlue: Rgb = [20, 34, 86]

const tintStops: TintStop[] = [
  { at: 0, color: nightBlue, strength: 0.68 },
  { at: 0.19, color: nightBlue, strength: 0.64 },
  { at: 0.25, color: [236, 150, 120], strength: 0.24 },
  { at: 0.32, color: [255, 214, 170], strength: 0.08 },
  { at: 0.45, color: [255, 255, 255], strength: 0 },
  { at: 0.6, color: [255, 226, 180], strength: 0.05 },
  { at: 0.71, color: [240, 146, 64], strength: 0.32 },
  { at: 0.77, color: [70, 76, 128], strength: 0.46 },
  { at: 0.83, color: nightBlue, strength: 0.64 },
  { at: 1, color: nightBlue, strength: 0.68 },
]

function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

export function multiplyTint(dayTime: number): string {
  const time = ((dayTime % 1) + 1) % 1
  const upperIndex = Math.max(1, tintStops.findIndex((stop) => stop.at >= time))
  const lower = tintStops[upperIndex - 1]
  const upper = tintStops[upperIndex]
  const amount = (time - lower.at) / Math.max(1e-6, upper.at - lower.at)
  const strength = mix(lower.strength, upper.strength, amount)
  const channels = lower.color.map((channel, index) => mix(channel, upper.color[index], amount))
  const blended = channels.map((channel) => Math.round(255 - (255 - channel) * strength))
  return `rgb(${blended[0]}, ${blended[1]}, ${blended[2]})`
}

export function nightness(dayTime: number): number {
  const fromMidnight = Math.min(dayTime, 1 - dayTime)
  return Math.min(1, Math.max(0, (0.24 - fromMidnight) / 0.06))
}

function bump(time: number, center: number, halfWidth: number): number {
  return Math.max(0, 1 - Math.abs(time - center) / halfWidth)
}

export function goldenness(dayTime: number): number {
  return Math.max(bump(dayTime, 0.715, 0.085) * 0.8, bump(dayTime, 0.28, 0.05) * 0.45)
}
