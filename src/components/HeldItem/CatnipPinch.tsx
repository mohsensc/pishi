interface CatnipPinchProps {
  size: number
  wiggle: number
}

const leaves = [
  { x: -6, y: 2, angle: -30, color: '#5f9e4a' },
  { x: 5, y: 3, angle: 40, color: '#79b85c' },
  { x: 0, y: -3, angle: 5, color: '#4c8a3c' },
  { x: -2, y: 7, angle: 70, color: '#8cc46c' },
]

export default function CatnipPinch({ size, wiggle }: CatnipPinchProps) {
  return (
    <g transform={`scale(${size / 20}) rotate(${wiggle})`}>
      {leaves.map((leaf) => (
        <ellipse key={`${leaf.x}-${leaf.y}`} cx={leaf.x} cy={leaf.y} rx={4.2} ry={2} fill={leaf.color} transform={`rotate(${leaf.angle} ${leaf.x} ${leaf.y})`} />
      ))}
      <circle cx={3} cy={-1} r={0.9} fill="#a5c98a" />
      <circle cx={-4} cy={5} r={0.8} fill="#a5c98a" />
    </g>
  )
}
