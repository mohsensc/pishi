import { createSeededRandom } from '../../game/random'
import reactions from './Reactions.module.css'
import { floorSquash } from './propView'

interface StationBowlProps {
  centerX: number
  centerY: number
  radius: number
  color: string
  fill: 'kibble' | 'water'
  level: number
  seed: number
  pourKey: string
  pouring: boolean
}

const kibbleTones = ['#9a6236', '#b87a45', '#8a5530', '#c58a50']
const maxKibble = 22

function kibblePieces(seed: number, radius: number, surfaceY: number, level: number) {
  const random = createSeededRandom(seed)
  const count = Math.round(maxKibble * level)
  return Array.from({ length: maxKibble }, () => {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * radius * 0.72
    return {
      cx: Math.cos(angle) * distance,
      cy: surfaceY + Math.sin(angle) * distance * floorSquash - (1 - distance / radius) * radius * 0.18 * level,
      tone: kibbleTones[Math.floor(random() * kibbleTones.length)],
      size: 1.7 + random() * 0.8,
    }
  })
    .slice(0, count)
    .sort((first, second) => first.cy - second.cy)
}

export default function StationBowl({ centerX, centerY, radius, color, fill, level, seed, pourKey, pouring }: StationBowlProps) {
  const bowlHeight = radius * 0.6
  const rimY = -bowlHeight
  const rimRadiusY = radius * floorSquash
  const clampedLevel = Math.max(0, Math.min(1, level))
  const surfaceY = rimY + rimRadiusY * 0.25 + (1 - clampedLevel) * bowlHeight * 0.35
  const pieces = fill === 'kibble' ? kibblePieces(seed, radius, surfaceY, clampedLevel) : []
  return (
    <g transform={`translate(${centerX} ${centerY})`}>
      <ellipse cx={0} cy={1.5} rx={radius * 1.08} ry={rimRadiusY * 0.8} fill="rgba(38, 62, 24, 0.18)" />
      <path
        d={`M ${-radius} ${rimY} L ${-radius * 0.8} 0 Q 0 ${radius * 0.28} ${radius * 0.8} 0 L ${radius} ${rimY} Z`}
        fill={color}
      />
      <path
        d={`M ${radius * 0.42} ${rimY + 2} L ${radius * 0.38} ${radius * 0.12} Q ${radius * 0.64} ${radius * 0.06} ${radius * 0.8} 0 L ${radius} ${rimY} Z`}
        fill="#000000"
        opacity={0.1}
      />
      <ellipse cx={0} cy={rimY} rx={radius} ry={rimRadiusY} fill="#f6f2ea" />
      <ellipse cx={0} cy={rimY + 0.6} rx={radius * 0.84} ry={rimRadiusY * 0.8} fill={fill === 'water' ? '#6fb0c8' : '#ddd3c1'} />
      {fill === 'water' ? (
        <g>
          <ellipse cx={0} cy={rimY + 0.8} rx={radius * 0.78} ry={rimRadiusY * 0.7} fill="#8fcadb" />
          <ellipse className={reactions.waterRipple} cx={radius * 0.1} cy={rimY + 1} rx={radius * 0.5} ry={rimRadiusY * 0.42} fill="none" stroke="#e6f6f9" strokeWidth={1} />
          <ellipse cx={-radius * 0.3} cy={rimY - 0.2} rx={radius * 0.24} ry={1.1} fill="#ffffff" opacity={0.75} />
        </g>
      ) : (
        <g key={pourKey} className={pouring ? reactions.kibblePour : undefined}>
          {clampedLevel > 0.02 && (
            <ellipse cx={0} cy={surfaceY} rx={radius * 0.74 * Math.sqrt(clampedLevel)} ry={rimRadiusY * 0.55 * Math.sqrt(clampedLevel)} fill="#a86b3c" />
          )}
          {pieces.map((piece) => (
            <ellipse key={`${piece.cx}${piece.cy}`} cx={piece.cx} cy={piece.cy} rx={piece.size} ry={piece.size * 0.8} fill={piece.tone} />
          ))}
        </g>
      )}
    </g>
  )
}
