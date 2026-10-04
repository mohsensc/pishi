import PropAnchor from './PropAnchor'
import StationBowl from './StationBowl'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'
import { hashString } from '../../game/random'

const matColor = '#d9826a'
const matEdge = '#c06b54'
const pawColor = '#f0b7a4'
const bagColor = '#d8b98a'
const bagShade = '#bf9c6c'
const bagLabel = '#f6efe0'
const fishColor = '#e0735a'

interface PawPrintProps {
  cx: number
  cy: number
  size: number
}

function PawPrint({ cx, cy, size }: PawPrintProps) {
  return (
    <g fill={pawColor}>
      <ellipse cx={cx} cy={cy} rx={size} ry={size * 0.62} />
      {[-1.1, -0.38, 0.38, 1.1].map((offset) => (
        <ellipse key={offset} cx={cx + offset * size * 0.85} cy={cy - size * (Math.abs(offset) > 1 ? 0.75 : 1.05)} rx={size * 0.32} ry={size * 0.24} />
      ))}
    </g>
  )
}

interface FoodBagProps {
  x: number
  y: number
  height: number
}

function FoodBag({ x, y, height }: FoodBagProps) {
  const width = height * 0.62
  const half = width / 2
  const top = y - height
  return (
    <g>
      <ellipse cx={x} cy={y + 1} rx={half * 1.15} ry={half * 0.3} fill={contactShadowColor} />
      <path d={`M ${x - half} ${y} L ${x - half * 0.92} ${top + height * 0.16} L ${x + half * 0.92} ${top + height * 0.16} L ${x + half} ${y} Z`} fill={bagColor} />
      <path d={`M ${x - half * 0.92} ${top + height * 0.16} L ${x - half * 0.8} ${top} L ${x + half * 0.8} ${top + height * 0.04} L ${x + half * 0.92} ${top + height * 0.16} Z`} fill={bagShade} />
      <path d={`M ${x + half * 0.55} ${y} L ${x + half * 0.5} ${top + height * 0.16} L ${x + half * 0.92} ${top + height * 0.16} L ${x + half} ${y} Z`} fill="#000000" opacity={0.08} />
      <rect x={x - half * 0.62} y={top + height * 0.36} width={half * 1.24} height={height * 0.36} rx={3} fill={bagLabel} />
      <path
        d={`M ${x - half * 0.36} ${top + height * 0.54} q ${half * 0.3} ${-height * 0.1} ${half * 0.6} 0 q ${-half * 0.3} ${height * 0.1} ${-half * 0.6} 0 Z M ${x + half * 0.24} ${top + height * 0.54} l ${half * 0.2} ${-height * 0.06} l 0 ${height * 0.12} Z`}
        fill={fishColor}
      />
      <circle cx={x - half * 0.2} cy={top + height * 0.53} r={1} fill={bagLabel} />
    </g>
  )
}

export default function FeedingStation({ prop, x, y, scale, zIndex }: PropViewProps) {
  const radius = prop.radius
  const matHalfWidth = radius * 1.15
  const matDepth = radius * 0.95
  const bowlRadius = radius * 0.4
  const seed = hashString(prop.id)
  const reaction = pokeReactionOf(prop)
  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={matDepth * 0.1} rx={matHalfWidth * 1.08} ry={matDepth * 0.62} fill={contactShadowColor} />
      <rect x={-matHalfWidth} y={-matDepth / 2} width={matHalfWidth * 2} height={matDepth} rx={matDepth * 0.32} fill={matEdge} />
      <rect x={-matHalfWidth + 2} y={-matDepth / 2 + 2} width={matHalfWidth * 2 - 4} height={matDepth - 6} rx={matDepth * 0.28} fill={matColor} />
      <rect
        x={-matHalfWidth + 6}
        y={-matDepth / 2 + 6}
        width={matHalfWidth * 2 - 12}
        height={matDepth - 14}
        rx={matDepth * 0.22}
        fill="none"
        stroke={pawColor}
        strokeWidth={1.2}
        strokeDasharray="3 3"
      />
      <PawPrint cx={0} cy={matDepth * 0.3} size={radius * 0.09} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.jostle)} style={{ transformOrigin: `${-matHalfWidth * 0.95}px ${-matDepth * 0.3}px` }}>
        <FoodBag x={-matHalfWidth * 0.95} y={-matDepth * 0.3} height={radius * 1.05} />
      </g>
      <g key={`bowls${reaction.key}`} className={reactionClass(reaction, reactions.rattle)}>
        <StationBowl
          centerX={-radius * 0.28}
          centerY={matDepth * 0.08}
          radius={bowlRadius}
          color="#e8624f"
          fill="kibble"
          level={prop.foodLevel}
          seed={seed}
          pourKey={reaction.key}
          pouring={reaction.poked}
        />
        <StationBowl
          centerX={radius * 0.62}
          centerY={-matDepth * 0.06}
          radius={bowlRadius * 0.92}
          color="#4a8fc0"
          fill="water"
          level={1}
          seed={seed + 1}
          pourKey="water"
          pouring={false}
        />
      </g>
    </PropAnchor>
  )
}
