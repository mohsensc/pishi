interface CatCollarProps {
  radius: number
  color: string
  fluffy: boolean
}

const tagGold = '#f2c94c'
const tagEdge = '#b28a2c'

export default function CatCollar({ radius, color, fluffy }: CatCollarProps) {
  const drop = fluffy ? 1.02 : 0.9
  const left = { x: -radius * 0.62, y: radius * (drop - 0.1) }
  const right = { x: radius * 0.66, y: radius * (drop - 0.16) }
  const dip = radius * (drop + 0.26)
  const band = `M ${left.x} ${left.y} Q ${radius * 0.04} ${dip} ${right.x} ${right.y}`
  const tag = { x: radius * 0.18, y: radius * (drop + 0.36) }
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path d={band} fill="none" stroke="rgba(0, 0, 0, 0.28)" strokeWidth={5.4} />
      <path d={band} fill="none" stroke={color} strokeWidth={4.2} />
      <path d={`M ${tag.x} ${tag.y - 3.2} v 1.4`} stroke={tagEdge} strokeWidth={0.9} />
      <circle cx={tag.x} cy={tag.y} r={2.8} fill={tagGold} stroke={tagEdge} strokeWidth={0.8} />
    </g>
  )
}
