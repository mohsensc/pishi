import { memo } from 'react'
import type { BallState } from '../../game/types'
import { BALL_RADIUS } from '../../game/constants'
import { depthScale, toScreen } from '../../game/projection'
import styles from './ToyMouse.module.css'

interface ToyMouseProps {
  ball: BallState
  worldHeight: number
  floating?: boolean
}

const felt = '#a3a2ad'
const feltShade = '#86858f'
const earPink = '#eeb2b6'

function headingOf(ball: BallState): 1 | -1 {
  if (Math.abs(ball.velocity.x) > 4) return ball.velocity.x > 0 ? 1 : -1
  return Math.cos(ball.spin) >= 0 ? 1 : -1
}

function ToyMouse({ ball, worldHeight, floating = false }: ToyMouseProps) {
  if (ball.status !== 'loose') return null
  const scale = depthScale(ball.position.y, worldHeight)
  const size = BALL_RADIUS * 3.1 * scale
  const floorPoint = toScreen(ball.position, 0)
  const liftedPoint = toScreen(ball.position, ball.height)
  const liftRatio = Math.min(ball.height / 160, 1)
  const shadowWidth = size * (0.95 - liftRatio * 0.4)
  const wobble = Math.sin(ball.spin * 2) * 14
  const airborne = ball.height > 4
  const tuck = airborne ? Math.sin(ball.spin) * 18 : 0
  return (
    <div className={styles.anchor} data-ball-id={ball.id} data-kind="mouse" style={{ zIndex: Math.round(ball.position.y) }}>
      <div
        className={floating ? styles.ripple : styles.shadow}
        style={{
          width: shadowWidth,
          height: shadowWidth * 0.3,
          opacity: 1 - liftRatio * 0.6,
          transform: `translate3d(${floorPoint.x - shadowWidth / 2}px, ${floorPoint.y - shadowWidth * 0.15}px, 0)`,
        }}
      />
      <div className={styles.lift} style={{ width: size, height: size, transform: `translate3d(${liftedPoint.x - size / 2}px, ${liftedPoint.y - size * 0.82}px, 0)` }}>
        <svg width={size} height={size} viewBox="-16 -16 32 32" aria-hidden="true" className={floating ? styles.bobbing : undefined}>
          <g transform={`scale(${headingOf(ball)} 1) rotate(${wobble + tuck})`}>
            <path d="M-8 3 C-12 3 -14 6 -12 8 C-10 10 -6 8 -7 12" fill="none" stroke={feltShade} strokeWidth="1.2" strokeLinecap="round" />
            <path d="M-9 3 C-9 -3 -3 -6 3 -5 C7 -4.4 10 -1.6 11 1.8 C11.4 3.2 10.6 4 9.4 4 L-7.6 4.6 C-8.6 4.6 -9 4 -9 3 Z" fill={felt} />
            <path d="M-8.6 3.4 C-4 2 3 2 9.6 3.4 L9.4 4 L-7.6 4.6 Z" fill={feltShade} />
            <circle cx="3.4" cy="-5.4" r="2.6" fill={felt} />
            <circle cx="3.4" cy="-5.4" r="1.5" fill={earPink} />
            <circle cx="7.6" cy="-0.6" r="0.9" fill="#26242a" />
            <circle cx="11" cy="1.8" r="0.8" fill={earPink} />
            <path d="M10.4 2.4 L14 1.2 M10.4 2.6 L14 3.4" stroke="#6f6e78" strokeWidth="0.4" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  )
}

export default memo(ToyMouse)
