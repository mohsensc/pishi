import type { Vec } from '../../../game/types'

interface CatEyeProps {
  center: Vec
  radiusX: number
  radiusY: number
  openness: number
  happy: number
  irisColor: string
  irisGlow: string
  lidColor: string
  furColor: string
  pupilOffset: Vec
  dilation: number
}

const pupilColor = '#15110f'
const closedThreshold = 0.22

function ClosedEye({ center, radiusX, radiusY, happy, lidColor }: Pick<CatEyeProps, 'center' | 'radiusX' | 'radiusY' | 'happy' | 'lidColor'>) {
  const content = happy > 0.5
  const bend = content ? -radiusY * 0.85 : radiusY * 0.7
  const lineY = center.y + (content ? radiusY * 0.25 : radiusY * 0.05)
  return (
    <path
      d={`M ${center.x - radiusX * 1.05} ${lineY} Q ${center.x} ${lineY + bend} ${center.x + radiusX * 1.05} ${lineY}`}
      fill="none"
      stroke={lidColor}
      strokeWidth={1.45}
      strokeLinecap="round"
    />
  )
}

function chordHalfWidth(radiusX: number, radiusY: number, offsetY: number): number {
  const ratio = Math.min(0.999, Math.abs(offsetY) / radiusY)
  return radiusX * Math.sqrt(1 - ratio * ratio)
}

function upperLidPath(center: Vec, radiusX: number, radiusY: number, edgeY: number, sag: number): string {
  const halfWidth = chordHalfWidth(radiusX, radiusY, edgeY)
  const largeArc = edgeY > 0 ? 1 : 0
  const left = center.x - halfWidth
  const right = center.x + halfWidth
  const y = center.y + edgeY
  return `M ${left} ${y} A ${radiusX} ${radiusY} 0 ${largeArc} 1 ${right} ${y} Q ${center.x} ${y + sag} ${left} ${y} Z`
}

function lowerLidPath(center: Vec, radiusX: number, radiusY: number, edgeY: number, lift: number): string {
  const halfWidth = chordHalfWidth(radiusX, radiusY, edgeY)
  const largeArc = edgeY < 0 ? 1 : 0
  const left = center.x - halfWidth
  const right = center.x + halfWidth
  const y = center.y + edgeY
  return `M ${left} ${y} A ${radiusX} ${radiusY} 0 ${largeArc} 0 ${right} ${y} Q ${center.x} ${y - lift} ${left} ${y} Z`
}

export default function CatEye({ center, radiusX, radiusY, openness, happy, irisColor, irisGlow, lidColor, furColor, pupilOffset, dilation }: CatEyeProps) {
  if (openness < closedThreshold) return <ClosedEye center={center} radiusX={radiusX} radiusY={radiusY} happy={happy} lidColor={lidColor} />
  const open = Math.min(1, openness)
  const pupilRadiusX = radiusX * (0.16 + dilation * 0.62)
  const pupilRadiusY = radiusY * (0.8 + dilation * 0.1)
  const pupilX = center.x + pupilOffset.x * radiusX * 0.4
  const pupilY = center.y + pupilOffset.y * radiusY * 0.28
  const lidEdge = radiusY * (1 - 2 * open)
  const showUpperLid = open < 0.96
  const lidSag = radiusY * 0.8 * (1 - open)
  const squint = happy > 0.25 ? Math.min(0.85, happy * 0.6) : 0
  const lowerEdge = radiusY * (1 - squint * 1.1)
  return (
    <g>
      <ellipse cx={center.x} cy={center.y} rx={radiusX} ry={radiusY} fill={irisColor} />
      <ellipse cx={center.x} cy={center.y + radiusY * 0.38} rx={radiusX * 0.72} ry={radiusY * 0.46} fill={irisGlow} opacity={0.7} />
      <ellipse cx={pupilX} cy={pupilY} rx={pupilRadiusX} ry={pupilRadiusY} fill={pupilColor} />
      <circle cx={pupilX - radiusX * 0.3} cy={pupilY - radiusY * 0.4} r={radiusX * (0.26 + dilation * 0.06)} fill="#ffffff" />
      <circle cx={pupilX + radiusX * 0.26} cy={pupilY + radiusY * 0.36} r={radiusX * 0.11} fill="#ffffff" opacity={0.8} />
      <ellipse cx={center.x} cy={center.y} rx={radiusX} ry={radiusY} fill="none" stroke={lidColor} strokeWidth={0.9} />
      {squint > 0 && <path d={lowerLidPath(center, radiusX + 0.7, radiusY + 0.7, lowerEdge, radiusY * 0.3 * squint)} fill={furColor} />}
      {showUpperLid && <path d={upperLidPath(center, radiusX + 0.7, radiusY + 0.7, lidEdge, lidSag)} fill={furColor} />}
      {showUpperLid && (
        <path
          d={`M ${center.x - chordHalfWidth(radiusX, radiusY, lidEdge) - 0.3} ${center.y + lidEdge} Q ${center.x} ${center.y + lidEdge + lidSag} ${center.x + chordHalfWidth(radiusX, radiusY, lidEdge) + 0.3} ${center.y + lidEdge}`}
          fill="none"
          stroke={lidColor}
          strokeWidth={1.25}
          strokeLinecap="round"
        />
      )}
    </g>
  )
}
