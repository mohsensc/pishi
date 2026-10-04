import { useId } from 'react'
import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const blanketPalettes = [
  { base: '#f6efe2', stripe: '#e05a4c' },
  { base: '#f4f0e6', stripe: '#4a8fc0' },
  { base: '#f7f0dc', stripe: '#e9a93a' },
]

export default function PicnicBlanket({ prop, x, y, scale }: PropViewProps) {
  const patternId = `gingham${useId().replace(/:/g, '')}`
  const palette = blanketPalettes[prop.variant % blanketPalettes.length]
  const halfWidth = prop.radius
  const depth = prop.radius * 0.62
  const skew = (prop.variant % 2 === 0 ? 1 : -1) * prop.radius * 0.16
  const cellSize = Math.max(8, prop.radius * 0.16)
  const corners = [
    { x: -halfWidth + skew, y: -depth / 2 },
    { x: halfWidth + skew, y: -depth / 2 - 3 },
    { x: halfWidth - skew, y: depth / 2 + 3 },
    { x: -halfWidth - skew, y: depth / 2 },
  ]
  const outline = `M ${corners[0].x} ${corners[0].y} L ${corners[1].x} ${corners[1].y} L ${corners[2].x} ${corners[2].y} L ${corners[3].x} ${corners[3].y} Z`
  const plateX = halfWidth * 0.35
  const plateY = -depth * 0.05
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.picnicBlanket} scale={scale}>
      <defs>
        <pattern id={patternId} width={cellSize * 2} height={cellSize} patternUnits="userSpaceOnUse">
          <rect width={cellSize * 2} height={cellSize} fill={palette.base} />
          <rect width={cellSize} height={cellSize} fill={palette.stripe} opacity={0.45} />
          <rect width={cellSize * 2} height={cellSize / 2} fill={palette.stripe} opacity={0.45} />
        </pattern>
      </defs>
      <path d={outline} fill="rgba(38, 62, 24, 0.14)" transform="translate(2 3)" />
      <g key={reaction.key} className={reactionClass(reaction, reactions.blanketRipple)} style={{ transformOrigin: '0px 0px' }}>
      <path d={outline} fill={`url(#${patternId})`} />
      <path d={outline} fill="none" stroke={palette.stripe} strokeWidth={2} opacity={0.6} />
      <path
        d={`M ${corners[3].x} ${corners[3].y} L ${corners[2].x} ${corners[2].y} L ${corners[2].x} ${corners[2].y + 3} L ${corners[3].x} ${corners[3].y + 3} Z`}
        fill={palette.stripe}
        opacity={0.7}
      />
      <ellipse cx={plateX} cy={plateY} rx={11} ry={5} fill="#ffffff" />
      <ellipse cx={plateX} cy={plateY} rx={7.5} ry={3.2} fill="#f0ebe0" />
      <circle cx={plateX - 2} cy={plateY - 1} r={2.4} fill="#c98a4b" />
      <circle cx={plateX + 2.5} cy={plateY} r={2.4} fill="#b8773d" />
      <circle cx={-halfWidth * 0.45} cy={depth * 0.1} r={4.5} fill="#d94c3f" />
      <path d={`M ${-halfWidth * 0.45} ${depth * 0.1 - 4} q 1 -3 3 -3`} stroke="#5c3b22" strokeWidth={1.2} fill="none" />
      <ellipse cx={-halfWidth * 0.45 - 1.5} cy={depth * 0.1 - 1.5} rx={1.4} ry={1} fill="#ffffff" opacity={0.5} />
      </g>
    </PropAnchor>
  )
}
