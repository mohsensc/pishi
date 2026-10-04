import type { Vec } from '../../game/types'
import Feather from './Feather'

interface WandLineProps {
  tip: Vec
  feather: Vec
  size: number
  tension: number
  restLength: number
}

const stickColor = '#7a5634'

export default function WandLine({ tip, feather, size, tension, restLength }: WandLineProps) {
  const handle = { x: tip.x + 30 * size, y: tip.y + 58 * size }
  const dx = feather.x - tip.x
  const dy = feather.y - tip.y
  const span = Math.hypot(dx, dy)
  const slack = Math.max(0, restLength - span) * (1 - tension)
  const control = { x: tip.x + dx * 0.5, y: tip.y + dy * 0.5 + slack * 0.7 }
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI - 90
  const bend = tension * 6 * size * Math.sign(dx || 1)
  return (
    <g>
      <path d={`M${handle.x} ${handle.y} Q${(handle.x + tip.x) / 2 + bend} ${(handle.y + tip.y) / 2} ${tip.x} ${tip.y}`} stroke={stickColor} strokeWidth={3.2 * size} strokeLinecap="round" fill="none" />
      <path
        d={`M${tip.x} ${tip.y} Q${control.x} ${control.y} ${feather.x} ${feather.y}`}
        stroke={tension > 0 ? '#3a3a3a' : 'rgba(40, 40, 40, 0.55)'}
        strokeWidth={(1 + tension * 0.8) * size}
        fill="none"
      />
      <g transform={`translate(${feather.x} ${feather.y})`}>
        <Feather angle={angle} size={30 * size} />
      </g>
    </g>
  )
}
