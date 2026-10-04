import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, floorSquash, pokeReactionOf, reactionClass, type PropViewProps } from './propView'

const yarnSets = [
  ['#e0584a', '#4a8fc0', '#f2b233'],
  ['#6fb07a', '#f3a9c1', '#f4efe2'],
  ['#f08a3c', '#9fc3ee', '#e0584a'],
]

interface YarnBallProps {
  cx: number
  cy: number
  radius: number
  color: string
}

function YarnBall({ cx, cy, radius, color }: YarnBallProps) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={radius} fill={color} />
      <path
        d={`M ${cx - radius * 0.8} ${cy - radius * 0.3} Q ${cx} ${cy - radius * 0.9} ${cx + radius * 0.8} ${cy - radius * 0.1} M ${cx - radius * 0.9} ${cy + radius * 0.15} Q ${cx} ${cy - radius * 0.45} ${cx + radius * 0.9} ${cy + radius * 0.35} M ${cx - radius * 0.6} ${cy + radius * 0.6} Q ${cx + radius * 0.1} ${cy} ${cx + radius * 0.55} ${cy + radius * 0.75}`}
        stroke="#ffffff"
        strokeOpacity={0.35}
        strokeWidth={1}
        fill="none"
      />
      <path d={`M ${cx + radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx - radius * 0.6} ${cy + radius * 0.8} A ${radius * 1.1} ${radius * 1.1} 0 0 0 ${cx + radius} ${cy} Z`} fill="#000000" opacity={0.12} />
    </g>
  )
}

export default function YarnBasket({ prop, x, y, scale, zIndex }: PropViewProps) {
  const size = Math.max(22, prop.radius * 1.4)
  const colors = yarnSets[prop.variant % yarnSets.length]
  const halfTop = size * 0.95
  const halfBottom = size * 0.72
  const basketHeight = size * 0.85
  const rimRadiusY = halfTop * floorSquash
  const rimY = -basketHeight
  const yarnRadius = size * 0.36
  const mirror = prop.variant % 2 === 0 ? 1 : -1
  const looseBallX = (halfTop + size * 0.9) * mirror
  const looseBallRadius = size * 0.3
  const weaveRows = [0.22, 0.45, 0.68, 0.9]
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={0} rx={halfTop * 1.2} ry={halfTop * 0.36} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.jostle)} style={{ transformOrigin: '0px 0px' }}>
      <path
        d={`M ${-halfTop * 0.8} ${rimY} Q ${looseBallX * 0.2} ${rimY - 18} ${looseBallX * 0.55} ${-6} T ${looseBallX} ${-looseBallRadius}`}
        stroke={colors[0]}
        strokeWidth={1.2}
        fill="none"
        opacity={0.9}
      />
      <ellipse cx={0} cy={rimY} rx={halfTop} ry={rimRadiusY} fill="#8e6035" />
      <YarnBall cx={-yarnRadius * 0.95} cy={rimY - yarnRadius * 0.35} radius={yarnRadius} color={colors[1]} />
      <YarnBall cx={yarnRadius * 0.9} cy={rimY - yarnRadius * 0.45} radius={yarnRadius * 0.95} color={colors[2]} />
      <YarnBall cx={0} cy={rimY - yarnRadius * 0.05} radius={yarnRadius * 1.02} color={colors[0]} />
      <line
        x1={yarnRadius * 0.4}
        y1={rimY - yarnRadius * 0.4}
        x2={yarnRadius * 2}
        y2={rimY - yarnRadius * 2.4}
        stroke="#c9b8a0"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <circle cx={yarnRadius * 2} cy={rimY - yarnRadius * 2.4} r={1.8} fill="#e0584a" />
      <path
        d={`M ${-halfTop} ${rimY} L ${-halfBottom} 0 Q 0 ${halfBottom * floorSquash} ${halfBottom} 0 L ${halfTop} ${rimY} Q 0 ${rimY + rimRadiusY * 2} ${-halfTop} ${rimY} Z`}
        fill="#c8955a"
      />
      {weaveRows.map((ratio) => {
        const rowY = rimY + (0 - rimY) * ratio
        const rowHalf = halfTop + (halfBottom - halfTop) * ratio
        return (
          <path
            key={ratio}
            d={`M ${-rowHalf} ${rowY} Q 0 ${rowY + rowHalf * floorSquash * 1.6} ${rowHalf} ${rowY}`}
            stroke="#a8773f"
            strokeWidth={1.3}
            fill="none"
          />
        )
      })}
      {[-0.6, -0.2, 0.2, 0.6].map((ratio) => (
        <line
          key={ratio}
          x1={halfTop * ratio}
          y1={rimY + rimRadiusY * (1 - Math.abs(ratio) * 0.6)}
          x2={halfBottom * ratio}
          y2={halfBottom * floorSquash * (1 - Math.abs(ratio) * 0.6)}
          stroke="#a8773f"
          strokeWidth={1.1}
          opacity={0.7}
        />
      ))}
      <path
        d={`M ${-halfTop} ${rimY} Q 0 ${rimY + rimRadiusY * 2} ${halfTop} ${rimY}`}
        stroke="#dcae74"
        strokeWidth={3.4}
        fill="none"
        strokeLinecap="round"
      />
      <YarnBall cx={looseBallX} cy={-looseBallRadius} radius={looseBallRadius} color={colors[0]} />
      </g>
    </PropAnchor>
  )
}
