import type { Vec } from '../../game/types'

interface CatLegProps {
  hip: Vec
  paw: Vec
  upperLength: number
  lowerLength: number
  width: number
  furColor: string
  sockColor: string | null
  sockReach: number
  pawRadiusX: number
  pawRadiusY: number
  fluffy: boolean
}

function solveKnee(hip: Vec, paw: Vec, upperLength: number, lowerLength: number): { knee: Vec; foot: Vec } {
  const deltaX = paw.x - hip.x
  const deltaY = paw.y - hip.y
  const rawDistance = Math.hypot(deltaX, deltaY) || 0.001
  const minimumDistance = Math.abs(upperLength - lowerLength) + 0.5
  const maximumDistance = upperLength + lowerLength - 0.01
  const distance = Math.min(maximumDistance, Math.max(minimumDistance, rawDistance))
  const directionAngle = Math.atan2(deltaY, deltaX)
  const cosineAtHip = (upperLength * upperLength + distance * distance - lowerLength * lowerLength) / (2 * upperLength * distance)
  const hipBend = Math.acos(Math.min(1, Math.max(-1, cosineAtHip)))
  const kneeAngle = directionAngle + hipBend
  const knee = { x: hip.x + Math.cos(kneeAngle) * upperLength, y: hip.y + Math.sin(kneeAngle) * upperLength }
  const foot = { x: hip.x + Math.cos(directionAngle) * distance, y: hip.y + Math.sin(directionAngle) * distance }
  return { knee, foot }
}

export default function CatLeg({
  hip,
  paw,
  upperLength,
  lowerLength,
  width,
  furColor,
  sockColor,
  sockReach,
  pawRadiusX,
  pawRadiusY,
  fluffy,
}: CatLegProps) {
  const { knee, foot } = solveKnee(hip, paw, upperLength, lowerLength)
  const legPath = `M ${hip.x} ${hip.y} L ${knee.x} ${knee.y} L ${foot.x} ${foot.y}`
  const sockStart = {
    x: foot.x + (knee.x - foot.x) * sockReach,
    y: foot.y + (knee.y - foot.y) * sockReach,
  }
  const pawColor = sockColor ?? furColor
  return (
    <g>
      <path d={legPath} fill="none" stroke={furColor} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {fluffy && (
        <path
          d={legPath}
          fill="none"
          stroke={furColor}
          strokeWidth={width + 3}
          strokeLinecap="round"
          strokeDasharray="0 4.5"
        />
      )}
      {sockColor && (
        <path
          d={`M ${sockStart.x} ${sockStart.y} L ${foot.x} ${foot.y}`}
          fill="none"
          stroke={sockColor}
          strokeWidth={width * 0.98}
          strokeLinecap="round"
        />
      )}
      <ellipse cx={foot.x + pawRadiusX * 0.35} cy={foot.y - pawRadiusY * 0.45} rx={pawRadiusX} ry={pawRadiusY} fill={pawColor} />
    </g>
  )
}
