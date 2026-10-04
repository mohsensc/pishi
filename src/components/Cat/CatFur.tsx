import { memo } from 'react'

interface CatFurProps {
  centerX: number
  centerY: number
  radiusX: number
  radiusY: number
  tuftRadius: number
  tuftCount: number
  color: string
  startAngle?: number
  endAngle?: number
}

function CatFur({
  centerX,
  centerY,
  radiusX,
  radiusY,
  tuftRadius,
  tuftCount,
  color,
  startAngle = 0,
  endAngle = 360,
}: CatFurProps) {
  const span = endAngle - startAngle
  const closedLoop = span >= 360
  const steps = closedLoop ? tuftCount : Math.max(1, tuftCount - 1)
  const tufts = Array.from({ length: tuftCount }, (_, index) => {
    const angle = ((startAngle + (span * index) / steps) * Math.PI) / 180
    const wobble = 1 + (index % 2 === 0 ? 0.12 : -0.05)
    return {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      radius: tuftRadius * wobble,
    }
  })
  return (
    <g fill={color}>
      {tufts.map((tuft, index) => (
        <circle key={index} cx={tuft.x} cy={tuft.y} r={tuft.radius} />
      ))}
    </g>
  )
}

export default memo(CatFur)
