import type { ButterflyState } from '../../game/types'
import { depthScale, toScreen } from '../../game/projection'
import styles from './Butterfly.module.css'

interface ButterflyProps {
  butterfly: ButterflyState
  worldHeight: number
}

const flyingZIndexBonus = 60

export default function Butterfly({ butterfly, worldHeight }: ButterflyProps) {
  const floor = toScreen(butterfly.position, 0)
  const scale = depthScale(butterfly.position.y, worldHeight)
  const facing = Math.cos(butterfly.heading) >= 0 ? 1 : -1
  const flap = Math.abs(Math.sin(butterfly.clock * 16))
  const wingSpread = 0.25 + flap * 0.75
  const bank = Math.sin(butterfly.clock * 2.3) * 12
  const wingColor = `hsl(${butterfly.hue} 78% 64%)`
  const wingEdge = `hsl(${butterfly.hue} 55% 38%)`
  const wingInner = `hsl(${(butterfly.hue + 30) % 360} 85% 80%)`
  const liftPixels = butterfly.height * scale
  const shadowScale = Math.max(0.35, 1 - butterfly.height / 160)

  return (
    <div
      className={styles.anchor}
      style={{ transform: `translate3d(${floor.x}px, ${floor.y}px, 0)`, zIndex: Math.round(butterfly.position.y) + flyingZIndexBonus }}
    >
      <svg className={styles.canvas} width="1" height="1" overflow="visible" aria-hidden="true">
        <ellipse cx={0} cy={0} rx={7 * scale * shadowScale} ry={2.4 * scale * shadowScale} fill="rgba(38, 62, 24, 0.18)" />
        <g transform={`translate(0 ${-liftPixels}) scale(${scale * facing} ${scale}) rotate(${bank})`}>
          <g transform={`scale(${wingSpread} 1)`}>
            <path d="M 0 -1 C -6 -12 -15 -11 -13 -3 C -12 1 -5 1 0 0 Z" fill={wingColor} stroke={wingEdge} strokeWidth={1} />
            <path d="M 0 0 C -5 2 -11 5 -8 9 C -5 11 -2 6 0 1 Z" fill={wingColor} stroke={wingEdge} strokeWidth={1} />
            <path d="M 0 -1 C 6 -12 15 -11 13 -3 C 12 1 5 1 0 0 Z" fill={wingColor} stroke={wingEdge} strokeWidth={1} />
            <path d="M 0 0 C 5 2 11 5 8 9 C 5 11 2 6 0 1 Z" fill={wingColor} stroke={wingEdge} strokeWidth={1} />
            <circle cx={-8} cy={-5} r={2} fill={wingInner} />
            <circle cx={8} cy={-5} r={2} fill={wingInner} />
          </g>
          <ellipse cx={0} cy={0} rx={1.3} ry={5} fill="#3a2f28" />
          <path d="M 0 -4.5 q -1.5 -4 -3.5 -5 M 0 -4.5 q 1.5 -4 3.5 -5" stroke="#3a2f28" strokeWidth={0.8} fill="none" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  )
}
