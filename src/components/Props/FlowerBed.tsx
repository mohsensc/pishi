import PropAnchor from './PropAnchor'
import reactions from './Reactions.module.css'
import { floorSquash, groundZIndex, pokeReactionOf, reactionClass, type PropViewProps } from './propView'
import { createSeededRandom, hashString } from '../../game/random'

const flowerPalettes = [
  ['#f07c6a', '#f6c24c', '#f4efe2'],
  ['#f3a9c1', '#e4637f', '#fbe3ea'],
  ['#f6c24c', '#f08a3c', '#fff2c8'],
  ['#9fc3ee', '#f4efe2', '#f3a9c1'],
]

export default function FlowerBed({ prop, x, y, scale }: PropViewProps) {
  const radiusX = prop.radius
  const radiusY = radiusX * floorSquash
  const palette = flowerPalettes[prop.variant % flowerPalettes.length]
  const random = createSeededRandom(hashString(prop.id) + 11)
  const borderStones = Array.from({ length: 22 }, (_, index) => {
    const angle = (index / 22) * Math.PI * 2
    return { cx: Math.cos(angle) * radiusX, cy: Math.sin(angle) * radiusY, size: 3.4 + random() * 1.6 }
  })
  const flowers = Array.from({ length: Math.round(radiusX / 2.4) }, () => {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * 0.78
    const stemX = Math.cos(angle) * radiusX * distance
    const stemY = Math.sin(angle) * radiusY * distance
    return {
      stemX,
      stemY,
      stemHeight: 9 + random() * 9,
      color: palette[Math.floor(random() * palette.length)],
      isTulip: random() > 0.45,
    }
  }).sort((first, second) => first.stemY - second.stemY)
  const backStones = borderStones.filter((stone) => stone.cy < 0)
  const frontStones = borderStones.filter((stone) => stone.cy >= 0)
  const reaction = pokeReactionOf(prop)

  return (
    <PropAnchor x={x} y={y} zIndex={groundZIndex.flowerBed} scale={scale}>
      <ellipse cx={0} cy={2} rx={radiusX + 4} ry={radiusY + 3} fill="rgba(38, 62, 24, 0.14)" />
      <ellipse cx={0} cy={0} rx={radiusX} ry={radiusY} fill="#8c6446" />
      <ellipse cx={0} cy={-1.5} rx={radiusX * 0.92} ry={radiusY * 0.86} fill="#9b7152" />
      {backStones.map((stone) => (
        <ellipse key={`${stone.cx}${stone.cy}`} cx={stone.cx} cy={stone.cy} rx={stone.size} ry={stone.size * 0.7} fill="#cdc6b4" />
      ))}
      {flowers.map((flower, index) => (
        <g
          key={`${flower.stemX}${flower.stemY}${reaction.key}`}
          className={reactionClass(reaction, reactions.flowerSway)}
          style={{ transformOrigin: `${flower.stemX}px ${flower.stemY}px`, animationDelay: `${(index % 7) * 0.03}s` }}>
          <line
            x1={flower.stemX}
            y1={flower.stemY}
            x2={flower.stemX}
            y2={flower.stemY - flower.stemHeight}
            stroke="#4f8a3e"
            strokeWidth={1.4}
          />
          <path
            d={`M ${flower.stemX} ${flower.stemY - 2} q -5 -2 -5 -7 q 3 1 5 5`}
            fill="#5f9e4b"
          />
          {flower.isTulip ? (
            <path
              d={`M ${flower.stemX - 3.2} ${flower.stemY - flower.stemHeight - 5.5} l 1.6 2 l 1.6 -2 l 1.6 2 l 1.6 -2 q 0.4 6 -3.2 6.6 q -3.6 -0.6 -3.2 -6.6 Z`}
              fill={flower.color}
            />
          ) : (
            <g>
              {[0, 72, 144, 216, 288].map((petalAngle) => (
                <circle
                  key={petalAngle}
                  cx={flower.stemX + Math.cos((petalAngle * Math.PI) / 180) * 2.6}
                  cy={flower.stemY - flower.stemHeight + Math.sin((petalAngle * Math.PI) / 180) * 2}
                  r={1.9}
                  fill={flower.color}
                />
              ))}
              <circle cx={flower.stemX} cy={flower.stemY - flower.stemHeight} r={1.3} fill="#e8a23a" />
            </g>
          )}
        </g>
      ))}
      {frontStones.map((stone) => (
        <g key={`${stone.cx}${stone.cy}`}>
          <ellipse cx={stone.cx} cy={stone.cy} rx={stone.size} ry={stone.size * 0.75} fill="#d8d1bf" />
          <ellipse cx={stone.cx - 0.8} cy={stone.cy - 0.9} rx={stone.size * 0.5} ry={stone.size * 0.3} fill="#ece6d6" />
        </g>
      ))}
    </PropAnchor>
  )
}
