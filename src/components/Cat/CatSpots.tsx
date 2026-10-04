import { memo, useMemo } from 'react'

interface CatSpotsProps {
  radiusX: number
  radiusY: number
  color: string
  seed: number
}

function seededRandom(seed: number): () => number {
  let state = Math.floor(seed * 2147483646) + 1
  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

function CatSpots({ radiusX, radiusY, color, seed }: CatSpotsProps) {
  const spots = useMemo(() => {
    const random = seededRandom(seed)
    const list: { x: number; y: number; width: number; height: number; tilt: number }[] = []
    for (let row = 0; row < 4; row += 1) {
      const y = -radiusY * 0.62 + row * radiusY * 0.42
      const offset = row % 2 === 0 ? 0 : 4.5
      for (let x = -radiusX * 1.1 + offset; x < radiusX * 0.85; x += 8.5) {
        list.push({
          x: x + (random() - 0.5) * 3,
          y: y + (random() - 0.5) * 2.5,
          width: 2 + random() * 1.3,
          height: 1.4 + random() * 0.9,
          tilt: (random() - 0.5) * 40,
        })
      }
    }
    return list
  }, [radiusX, radiusY, seed])
  return (
    <g fill={color}>
      <ellipse cx={-radiusX * 0.1} cy={-radiusY * 0.98} rx={radiusX * 0.85} ry={2.2} />
      {spots.map((spot, index) => (
        <ellipse
          key={index}
          cx={spot.x}
          cy={spot.y}
          rx={spot.width}
          ry={spot.height}
          transform={`rotate(${spot.tilt} ${spot.x} ${spot.y})`}
        />
      ))}
    </g>
  )
}

export default memo(CatSpots)
