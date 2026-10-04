import DanglingTail from '../Cat/hints/DanglingTail'
import PropAnchor from './PropAnchor'
import styles from './Props.module.css'
import reactions from './Reactions.module.css'
import { groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const canopyPalettes = [
  { dark: '#3f7a3c', mid: '#4f8f47', light: '#66a656', glint: '#86bf6c' },
  { dark: '#4a7f36', mid: '#5c9442', light: '#74ab52', glint: '#95c46e' },
]

type CanopyBlob = [number, number, number]

const canopyBlobs: CanopyBlob[] = [
  [-1.25, -0.1, 1.05],
  [1.2, -0.05, 1.05],
  [-0.55, -0.75, 1.15],
  [0.6, -0.8, 1.1],
  [0, -0.2, 1.3],
  [-0.1, -1.25, 0.95],
  [-1.5, 0.45, 0.7],
  [1.45, 0.5, 0.72],
  [0, 0.55, 0.85],
]

const shadeTreeCanopyZOffset = 400

export default function ShadeTree({ prop, x, y, scale, zIndex, time, occupantCoats }: PropViewProps) {
  const palette = canopyPalettes[prop.variant % canopyPalettes.length]
  const trunkRadius = prop.radius
  const trunkWidth = trunkRadius * 0.8
  const trunkHeight = trunkRadius * 4.4
  const canopyUnit = trunkRadius * 1.55
  const canopyCenterY = -trunkHeight - canopyUnit * 0.9
  const mirror = prop.variant % 2 === 0 ? 1 : -1
  const shadeRadiusX = canopyUnit * 2.9
  const shadeRadiusY = shadeRadiusX * 0.36
  const reaction = pokeReactionOf(prop)
  const hiddenCoats = occupantCoats ?? []
  const canopyBottomY = canopyCenterY + canopyUnit * 0.95

  return (
    <>
      <PropAnchor x={x} y={y} zIndex={groundZIndex.treeShade} scale={scale} className={styles.passive}>
        {[1, 0.85, 0.7, 0.52].map((ratio) => (
          <ellipse
            key={ratio}
            cx={trunkRadius * 0.4}
            cy={-shadeRadiusY * 0.2}
            rx={shadeRadiusX * ratio}
            ry={shadeRadiusY * ratio}
            fill="#2f5a22"
            opacity={0.035}
          />
        ))}
        <ellipse cx={0} cy={0} rx={trunkRadius * 1.1} ry={trunkRadius * 0.35} fill="#2f5a22" opacity={0.18} />
      </PropAnchor>
      <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
        <g key={reaction.key} className={reactionClass(reaction, reactions.trunkShake)} style={{ transformOrigin: '0px 0px' }}>
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
        <path
          d={`M 0 ${-trunkHeight + 4} L ${mirror * trunkRadius * 1.2} ${-trunkHeight - trunkRadius * 1.1}`}
          stroke="#8b5d3b"
          strokeWidth={trunkRadius * 0.28}
          strokeLinecap="round"
        />
        </g>
      </PropAnchor>
      <PropAnchor x={x} y={y} zIndex={zIndex + shadeTreeCanopyZOffset} scale={scale}>
        <g key={reaction.key} className={reactionClass(reaction, reactions.canopyShake)} style={{ transformOrigin: `0px ${-trunkHeight}px` }}>
        <g className={hiddenCoats.length > 0 ? reactions.canopyRustle : undefined}>
        {hiddenCoats.map((coat, index) => (
          <g key={`tail${index}`} transform={`translate(${(index === 0 ? -0.95 : 1.05) * canopyUnit * mirror} ${canopyBottomY - canopyUnit * 0.1})`}>
            <DanglingTail coat={coat} size={canopyUnit * 0.9} clock={time + index * 1.7} />
          </g>
        ))}
        <g className={styles.sway} style={{ transformOrigin: `0px ${-trunkHeight}px`, opacity: 0.94 }}>
          {canopyBlobs.map(([blobX, blobY, blobRadius]) => (
            <circle
              key={`dark${blobX}${blobY}`}
              cx={blobX * canopyUnit * mirror}
              cy={canopyCenterY + blobY * canopyUnit}
              r={blobRadius * canopyUnit}
              fill={palette.dark}
            />
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
        </g>
        </g>
      </PropAnchor>
    </>
  )
}
