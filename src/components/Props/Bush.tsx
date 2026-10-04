import GlintingEyes from '../Cat/hints/GlintingEyes'
import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { contactShadowColor, pokeReactionOf, reactionClass, type PropViewProps } from './propView'
import { createSeededRandom, hashString } from '../../game/random'

type Blob = [number, number, number]

const bushShapes: Blob[][] = [
  [[-0.55, -0.55, 0.55], [0.5, -0.5, 0.58], [0, -0.95, 0.7], [-0.2, -0.45, 0.6], [0.3, -0.35, 0.5]],
  [[-0.7, -0.4, 0.45], [-0.25, -0.8, 0.6], [0.35, -0.85, 0.55], [0.75, -0.45, 0.45], [0, -0.4, 0.6]],
  [[-0.4, -0.6, 0.6], [0.35, -0.7, 0.65], [0, -0.35, 0.55]],
]

const leafPalettes = [
  { back: '#4d8a3f', mid: '#5f9e4b', front: '#72b258', highlight: '#8cc56c' },
  { back: '#447f47', mid: '#579552', front: '#6aa962', highlight: '#86bf78' },
  { back: '#5a8e3a', mid: '#6ca347', front: '#80b757', highlight: '#9acb70' },
]

const blossomColors = ['#f4f1e6', '#f3a9b8', '#f6d25a']

export default function Bush({ prop, x, y, scale, zIndex, occupantCoats }: PropViewProps) {
  const shape = bushShapes[prop.variant % bushShapes.length]
  const palette = leafPalettes[(prop.variant >> 1) % leafPalettes.length]
  const hasBlossoms = prop.variant % 3 !== 2
  const blossomColor = blossomColors[prop.variant % blossomColors.length]
  const size = prop.radius * 1.15
  const random = createSeededRandom(hashString(prop.id))
  const blossoms = hasBlossoms
    ? Array.from({ length: 9 }, () => {
        const blob = shape[Math.floor(random() * shape.length)]
        const angle = random() * Math.PI * 2
        const distance = random() * blob[2] * 0.75
        return { cx: (blob[0] + Math.cos(angle) * distance) * size, cy: (blob[1] + Math.sin(angle) * distance * 0.8) * size }
      })
    : []
  const sortedShape = [...shape].sort((first, second) => first[1] - second[1])
  const reaction = pokeReactionOf(prop)
  const hiddenCoats = (occupantCoats ?? []).slice(0, 2)

  return (
    <PropAnchor x={x} y={y} zIndex={zIndex} scale={scale}>
      <ellipse cx={0} cy={0} rx={size * 1.15} ry={size * 0.36} fill={contactShadowColor} />
      <g key={reaction.key} className={reactionClass(reaction, reactions.bushRustle)} style={{ transformOrigin: '0px 0px' }}>
      <g className={hiddenCoats.length > 0 ? reactions.lurk : undefined} style={{ transformOrigin: '0px 0px' }}>
      {sortedShape.map(([blobX, blobY, blobRadius]) => (
        <circle key={`back${blobX}${blobY}`} cx={blobX * size} cy={blobY * size} r={blobRadius * size + 2} fill={palette.back} />
      ))}
      {sortedShape.map(([blobX, blobY, blobRadius]) => (
        <circle key={`mid${blobX}${blobY}`} cx={blobX * size} cy={blobY * size} r={blobRadius * size} fill={palette.mid} />
      ))}
      {sortedShape.map(([blobX, blobY, blobRadius]) => (
        <circle
          key={`front${blobX}${blobY}`}
          cx={blobX * size - blobRadius * size * 0.18}
          cy={blobY * size - blobRadius * size * 0.2}
          r={blobRadius * size * 0.68}
          fill={palette.front}
        />
      ))}
      {sortedShape.map(([blobX, blobY, blobRadius]) => (
        <circle
          key={`high${blobX}${blobY}`}
          cx={blobX * size - blobRadius * size * 0.32}
          cy={blobY * size - blobRadius * size * 0.4}
          r={blobRadius * size * 0.28}
          fill={palette.highlight}
          opacity={0.8}
        />
      ))}
      <path
        d={`M ${-size * 0.9} ${-2} Q 0 ${size * 0.08} ${size * 0.9} ${-2}`}
        stroke={palette.back}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      {blossoms.map((blossom) => (
        <g key={`${blossom.cx}${blossom.cy}`}>
          <circle cx={blossom.cx} cy={blossom.cy} r={2.4} fill={blossomColor} />
          <circle cx={blossom.cx} cy={blossom.cy} r={0.9} fill="#e8a23a" />
        </g>
      ))}
      {hiddenCoats.map((coat, index) => (
        <g key={`eyes${index}`} transform={`translate(${hiddenCoats.length === 2 ? (index === 0 ? -size * 0.38 : size * 0.4) : size * 0.05} ${-size * (index === 0 ? 0.52 : 0.62)})`}>
          <GlintingEyes coat={coat} size={size * 0.7} />
        </g>
      ))}
      </g>
      </g>
    </PropAnchor>
  )
}
