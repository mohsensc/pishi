import { canopyBlobs, type TreeGeometry } from './treeGeometry'

const canopyPalettes = [
  { dark: '#3f7a3c', mid: '#4f8f47', light: '#66a656', glint: '#86bf6c' },
  { dark: '#4a7f36', mid: '#5c9442', light: '#74ab52', glint: '#95c46e' },
]

export function TreeShade({ geometry }: { geometry: TreeGeometry }) {
  const { trunkRadius, canopyUnit } = geometry
  const shadeRadiusX = canopyUnit * 2.9
  const shadeRadiusY = shadeRadiusX * 0.36
  return (
    <>
      {[1, 0.85, 0.7, 0.52].map((ratio) => (
        <ellipse key={ratio} cx={trunkRadius * 0.4} cy={-shadeRadiusY * 0.2} rx={shadeRadiusX * ratio} ry={shadeRadiusY * ratio} fill="#2f5a22" opacity={0.035} />
      ))}
      <ellipse cx={0} cy={0} rx={trunkRadius * 1.1} ry={trunkRadius * 0.35} fill="#2f5a22" opacity={0.18} />
    </>
  )
}

export function TreeTrunk({ geometry }: { geometry: TreeGeometry }) {
  const { trunkRadius, trunkWidth, trunkHeight, mirror } = geometry
  return (
    <>
      <path
        d={`M ${-trunkWidth / 2 - trunkRadius * 0.5} 0 Q ${-trunkWidth / 2} ${-trunkRadius * 0.2} ${-trunkWidth / 2} ${-trunkRadius * 0.9} L ${-trunkWidth * 0.36} ${-trunkHeight - 6} L ${trunkWidth * 0.36} ${-trunkHeight - 6} L ${trunkWidth / 2} ${-trunkRadius * 0.9} Q ${trunkWidth / 2} ${-trunkRadius * 0.2} ${trunkWidth / 2 + trunkRadius * 0.55} 0 Z`}
        fill="#8b5d3b"
      />
      <path
        d={`M ${trunkWidth * 0.12} 0 L ${trunkWidth * 0.14} ${-trunkHeight - 6} L ${trunkWidth * 0.36} ${-trunkHeight - 6} L ${trunkWidth / 2} ${-trunkRadius * 0.9} Q ${trunkWidth / 2} ${-trunkRadius * 0.2} ${trunkWidth / 2 + trunkRadius * 0.55} 0 Z`}
        fill="#6f4a2e"
        opacity={0.55}
      />
      <path
        d={`M ${-trunkWidth * 0.15} ${-trunkHeight * 0.35} q 3 -8 1 -16 M ${trunkWidth * 0.05} ${-trunkHeight * 0.62} q -3 -6 -1 -12`}
        stroke="#6a452a"
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <path d={`M 0 ${-trunkHeight + 4} L ${mirror * trunkRadius * 1.2} ${-trunkHeight - trunkRadius * 1.1}`} stroke="#8b5d3b" strokeWidth={trunkRadius * 0.28} strokeLinecap="round" />
    </>
  )
}

interface TreeCanopyProps {
  geometry: TreeGeometry
  variant: number
  className?: string
}

export function TreeCanopy({ geometry, variant, className }: TreeCanopyProps) {
  const palette = canopyPalettes[variant % canopyPalettes.length]
  const { canopyUnit, canopyCenterY, trunkHeight, mirror } = geometry
  return (
    <g className={className} style={{ transformOrigin: `0px ${-trunkHeight}px`, opacity: 0.94 }}>
      {canopyBlobs.map(([blobX, blobY, blobRadius]) => (
        <circle key={`dark${blobX}${blobY}`} cx={blobX * canopyUnit * mirror} cy={canopyCenterY + blobY * canopyUnit} r={blobRadius * canopyUnit} fill={palette.dark} />
      ))}
      {canopyBlobs.map(([blobX, blobY, blobRadius]) => (
        <circle
          key={`mid${blobX}${blobY}`}
          cx={(blobX * canopyUnit - blobRadius * canopyUnit * 0.12) * mirror}
          cy={canopyCenterY + blobY * canopyUnit - blobRadius * canopyUnit * 0.14}
          r={blobRadius * canopyUnit * 0.84}
          fill={palette.mid}
        />
      ))}
      {canopyBlobs.slice(0, 6).map(([blobX, blobY, blobRadius]) => (
        <circle
          key={`light${blobX}${blobY}`}
          cx={(blobX * canopyUnit - blobRadius * canopyUnit * 0.3) * mirror}
          cy={canopyCenterY + blobY * canopyUnit - blobRadius * canopyUnit * 0.35}
          r={blobRadius * canopyUnit * 0.45}
          fill={palette.light}
        />
      ))}
      {canopyBlobs.slice(2, 6).map(([blobX, blobY, blobRadius]) => (
        <circle
          key={`glint${blobX}${blobY}`}
          cx={(blobX * canopyUnit - blobRadius * canopyUnit * 0.45) * mirror}
          cy={canopyCenterY + blobY * canopyUnit - blobRadius * canopyUnit * 0.55}
          r={blobRadius * canopyUnit * 0.16}
          fill={palette.glint}
        />
      ))}
    </g>
  )
}

interface CanopyRimProps {
  geometry: TreeGeometry
  id: string
  width?: number
}

export function CanopyRim({ geometry, id, width = 3 }: CanopyRimProps) {
  const { canopyUnit, canopyCenterY, mirror, trunkWidth, trunkHeight } = geometry
  const maskId = `canopy-rim-${id}`
  const span = canopyUnit * 4
  return (
    <>
      <mask id={maskId} maskUnits="userSpaceOnUse" x={-span} y={canopyCenterY - span} width={span * 2} height={span * 2 - canopyCenterY}>
        {canopyBlobs.map(([blobX, blobY, blobRadius]) => (
          <circle key={`outer${blobX}${blobY}`} cx={blobX * canopyUnit * mirror} cy={canopyCenterY + blobY * canopyUnit} r={blobRadius * canopyUnit + width} fill="#ffffff" />
        ))}
        <rect x={-trunkWidth / 2 - width} y={-trunkHeight} width={trunkWidth + width * 2} height={trunkHeight + width} rx={width} fill="#ffffff" />
        {canopyBlobs.map(([blobX, blobY, blobRadius]) => (
          <circle key={`inner${blobX}${blobY}`} cx={blobX * canopyUnit * mirror} cy={canopyCenterY + blobY * canopyUnit} r={blobRadius * canopyUnit} fill="#000000" />
        ))}
        <rect x={-trunkWidth / 2} y={-trunkHeight + 2} width={trunkWidth} height={trunkHeight + width * 2} fill="#000000" />
      </mask>
      <rect x={-span} y={canopyCenterY - span} width={span * 2} height={span * 2 - canopyCenterY} fill="#ffffff" mask={`url(#${maskId})`} />
    </>
  )
}
