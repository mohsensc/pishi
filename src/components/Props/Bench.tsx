import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const woodPalettes = [
  { top: '#c48a55', edge: '#9f6c3e', back: '#b27a47' },
  { top: '#8fb2a1', edge: '#6c8f7e', back: '#7fa392' },
  { top: '#d0a06a', edge: '#aa7b48', back: '#bd8d5a' },
]

const ironColor = '#3d4640'

export default function Bench({ prop, x, y, scale, zIndex }: PropViewProps) {
  const palette = woodPalettes[prop.variant % woodPalettes.length]
  const length = prop.radius * 2
  const halfLength = length / 2
  const seatDepth = 16
  const seatHeight = Math.max(18, prop.perchHeight - seatDepth / 2)
  const seatFrontY = -seatHeight
  const seatBackY = seatFrontY - seatDepth
  const backrestTop = seatBackY - 34
  const legInset = halfLength * 0.84
  const slatGap = 1.6
  const slatDepth = (seatDepth - slatGap * 2) / 3
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={-seatDepth * 0.4} rx={halfLength * 1.05} ry={seatDepth * 0.9} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.benchBounce)} style={{ transformOrigin: '0px 0px' }}>
      {[-legInset, legInset].map((legX) => (
        <g key={`back${legX}`}>
          <rect x={legX - 2.5} y={backrestTop} width={5} height={-seatDepth - backrestTop} fill={ironColor} />
        </g>
      ))}
      {[0, 1].map((plankIndex) => (
        <g key={`plank${plankIndex}`}>
          <rect
            x={-halfLength}
            y={backrestTop + 3 + plankIndex * 13}
            width={length}
            height={9}
            rx={2}
            fill={palette.back}
          />
          <rect
            x={-halfLength}
            y={backrestTop + 3 + plankIndex * 13 + 6.5}
            width={length}
            height={2.5}
            fill={palette.edge}
            opacity={0.7}
          />
        </g>
      ))}
      {[0, 1, 2].map((slatIndex) => (
        <rect
          key={`slat${slatIndex}`}
          x={-halfLength}
          y={seatBackY + slatIndex * (slatDepth + slatGap)}
          width={length}
          height={slatDepth}
          rx={1.5}
          fill={palette.top}
        />
      ))}
      <rect x={-halfLength} y={seatFrontY} width={length} height={4} rx={1.5} fill={palette.edge} />
      {[-legInset, legInset].map((legX) => (
        <g key={`front${legX}`}>
          <path
            d={`M ${legX - 3} 0 L ${legX - 2} ${seatFrontY + 4} L ${legX + 2} ${seatFrontY + 4} L ${legX + 3} 0 Z`}
            fill={ironColor}
          />
          <path
            d={`M ${legX + (legX < 0 ? -2 : 2)} ${seatFrontY - 2} q ${legX < 0 ? -9 : 9} -6 ${legX < 0 ? -4 : 4} -16 q ${legX < 0 ? 2 : -2} -5 ${legX < 0 ? 5 : -5} -3`}
            stroke={ironColor}
            strokeWidth={3.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      ))}
      </g>
    </PropAnchor>
  )
}
