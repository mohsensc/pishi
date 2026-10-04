import type { CSSProperties, ReactNode } from 'react'
import DragShadow from './DragShadow'
import { isSquashing, landingSquash } from './landingSquash'
import styles from './Draggable.module.css'

interface DraggableProps {
  x: number
  y: number
  depth: number
  footprint: number
  lift: number
  tilt: number
  droppedAt: number | null
  time: number
  discarding?: boolean
  children: ReactNode
}

const liftedLayerBoost = 30
const restThreshold = 0.3

export default function Draggable({ x, y, depth, footprint, lift, tilt, droppedAt, time, discarding = false, children }: DraggableProps) {
  const lifted = lift > restThreshold
  const active = lifted || Math.abs(tilt) > restThreshold || isSquashing(droppedAt, time) || discarding
  const squash = landingSquash(droppedAt, time)
  const shrink = discarding ? 0.9 : 1
  const className = active ? (discarding ? `${styles.carried} ${styles.discarding}` : styles.carried) : styles.resting
  const style: CSSProperties | undefined = active
    ? {
        transformOrigin: `${x}px ${y}px`,
        transform: `translate3d(0, ${-lift}px, 0) rotate(${tilt}deg) scale(${squash.scaleX * shrink}, ${squash.scaleY * shrink})`,
        zIndex: Math.round(depth) + (lifted ? liftedLayerBoost : 0),
      }
    : undefined
  return (
    <>
      {lifted ? <DragShadow x={x} y={y} width={footprint} lift={lift} /> : null}
      <div className={className} style={style}>
        {children}
      </div>
    </>
  )
}
