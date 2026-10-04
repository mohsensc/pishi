import { memo } from 'react'
import { arcPoint, sunProgress, type SkyFrame } from './skyArc'

interface SunProps {
  frame: SkyFrame
  dayTime: number
}

function mixChannel(from: number, to: number, amount: number): number {
  return Math.round(from + (to - from) * amount)
}

function sunColor(lift: number): string {
  return `rgb(${mixChannel(255, 255, lift)}, ${mixChannel(176, 243, lift)}, ${mixChannel(92, 196, lift)})`
}

function Sun({ frame, dayTime }: SunProps) {
  const progress = sunProgress(dayTime)
  if (progress === null) return null
  const point = arcPoint(progress, frame)
  const lift = Math.min(1, Math.sin(Math.PI * progress) * 1.6)
  const color = sunColor(lift)
  return (
    <g>
      <circle cx={point.x} cy={point.y} r={44 - lift * 4} fill={color} opacity={0.35 + (1 - lift) * 0.2} />
      <circle cx={point.x} cy={point.y} r={22 + (1 - lift) * 4} fill={color} />
    </g>
  )
}

export default memo(Sun)
