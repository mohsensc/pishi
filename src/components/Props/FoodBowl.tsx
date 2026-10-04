import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, floorSquash, pokeReactionOf, reactionClass, type PropViewProps } from './propView'
import { createSeededRandom, hashString } from '../../game/random'

const bowlColors = ['#e8624f', '#4a8fc0', '#f2b233', '#6fb07a']
const matColors = ['#e9dfc9', '#d9e5e1', '#f1ddd2']

interface BowlProps {
  centerX: number
  radius: number
  color: string
  filling: 'kibble' | 'water'
  seed: number
}

function Bowl({ centerX, radius, color, filling, seed }: BowlProps) {
  const bowlHeight = radius * 0.62
  const rimRadiusY = radius * floorSquash
  const rimY = -bowlHeight
  const random = createSeededRandom(seed)
  const kibble = Array.from({ length: 14 }, () => {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * radius * 0.7
    return { cx: centerX + Math.cos(angle) * distance, cy: rimY + Math.sin(angle) * distance * floorSquash - 1.5, tone: random() > 0.5 ? '#9a6236' : '#b87a45' }
  }).sort((first, second) => first.cy - second.cy)
  return (
    <g>
      <path
        d={`M ${centerX - radius} ${rimY} L ${centerX - radius * 0.78} 0 Q ${centerX} ${radius * 0.3} ${centerX + radius * 0.78} 0 L ${centerX + radius} ${rimY} Z`}
        fill={color}
      />
      <path
        d={`M ${centerX + radius * 0.45} ${rimY + 2} L ${centerX + radius * 0.4} ${radius * 0.12} Q ${centerX + radius * 0.65} ${radius * 0.06} ${centerX + radius * 0.78} 0 L ${centerX + radius} ${rimY} Z`}
        fill="#000000"
        opacity={0.1}
      />
      <ellipse cx={centerX} cy={rimY} rx={radius} ry={rimRadiusY} fill="#f4f1ea" />
      <ellipse cx={centerX} cy={rimY + 0.5} rx={radius * 0.84} ry={rimRadiusY * 0.8} fill={filling === 'water' ? '#8ccbd8' : '#e2d9c8'} />
      {filling === 'water' ? (
        <ellipse cx={centerX - radius * 0.25} cy={rimY - 0.5} rx={radius * 0.3} ry={1.2} fill="#ffffff" opacity={0.7} />
      ) : (
        kibble.map((piece) => <circle key={`${piece.cx}${piece.cy}`} cx={piece.cx} cy={piece.cy} r={1.9} fill={piece.tone} />)
      )}
    </g>
  )
}

export default function FoodBowl({ prop, x, y, scale, zIndex }: PropViewProps) {
  const seed = hashString(prop.id)
  const bowlRadius = Math.max(10, prop.radius * 0.95)
  const hasPair = prop.variant % 3 !== 2
  const color = bowlColors[prop.variant % bowlColors.length]
  const matColor = matColors[prop.variant % matColors.length]
  const matHalf = hasPair ? bowlRadius * 2.4 : bowlRadius * 1.5
  const matDepth = bowlRadius * 1.3
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <rect x={-matHalf} y={-matDepth / 2} width={matHalf * 2} height={matDepth} rx={matDepth * 0.4} fill={matColor} />
      <ellipse cx={0} cy={1} rx={matHalf * 0.85} ry={matDepth * 0.3} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.rattle)}>
      {hasPair ? (
        <>
          <Bowl centerX={-bowlRadius * 1.1} radius={bowlRadius} color={color} filling="kibble" seed={seed} />
          <Bowl centerX={bowlRadius * 1.1} radius={bowlRadius} color={color} filling="water" seed={seed + 1} />
        </>
      ) : (
        <Bowl centerX={0} radius={bowlRadius * 1.1} color={color} filling="kibble" seed={seed} />
      )}
      </g>
    </PropAnchor>
  )
}
