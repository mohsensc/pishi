import type { Vec } from '../../game/types'

interface CatTailProps {
  base: Vec
  angle: number
  curl: number
  length: number
  width: number
  puff: number
  color: string
  tipColor: string | null
  ringColor: string | null
  fluffy: boolean
}

function directionFromAngle(degrees: number): Vec {
  const radians = (degrees * Math.PI) / 180
  return { x: Math.cos(radians), y: -Math.sin(radians) }
}

export default function CatTail({ base, angle, curl, length, width, puff, color, tipColor, ringColor, fluffy }: CatTailProps) {
  const firstDirection = directionFromAngle(angle)
  const middleDirection = directionFromAngle(angle + curl * 0.55)
  const lastDirection = directionFromAngle(angle + curl)
  const controlA = { x: base.x + firstDirection.x * length * 0.38, y: base.y + firstDirection.y * length * 0.38 }
  const controlB = { x: controlA.x + middleDirection.x * length * 0.34, y: controlA.y + middleDirection.y * length * 0.34 }
  const tip = { x: controlB.x + lastDirection.x * length * 0.32, y: controlB.y + lastDirection.y * length * 0.32 }
  const tailPath = `M ${base.x} ${base.y} C ${controlA.x} ${controlA.y} ${controlB.x} ${controlB.y} ${tip.x} ${tip.y}`
  const tailWidth = width * (1 + puff * 0.9)
  const tuftGap = fluffy ? 5 : 3.2
  return (
    <g>
      <path d={tailPath} fill="none" stroke={color} strokeWidth={tailWidth} strokeLinecap="round" />
      {(fluffy || puff > 0.05) && (
        <path
          d={tailPath}
          fill="none"
          stroke={color}
          strokeWidth={tailWidth + (fluffy ? 5 : 3 * puff)}
          strokeLinecap="round"
          strokeDasharray={`0 ${tuftGap}`}
        />
      )}
      {ringColor && (
        <path
          d={tailPath}
          pathLength={100}
          fill="none"
          stroke={ringColor}
          strokeWidth={tailWidth * 1.02}
          strokeDasharray="0 42 7 7 7 7 30"
        />
      )}
      {tipColor && (
        <path
          d={tailPath}
          pathLength={100}
          fill="none"
          stroke={tipColor}
          strokeWidth={tailWidth * 1.02}
          strokeLinecap="round"
          strokeDasharray="16 84"
          strokeDashoffset={16}
        />
      )}
    </g>
  )
}
