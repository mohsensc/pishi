import { memo } from 'react'
import styles from './Draggable.module.css'

interface DragShadowProps {
  x: number
  y: number
  width: number
  lift: number
}

const groundLayer = 5

function DragShadow({ x, y, width, lift }: DragShadowProps) {
  const spread = width * (1 + Math.min(lift, 90) / 70)
  const height = spread * 0.32
  const opacity = Math.max(0.35, 1 - lift / 110)
  return (
    <div
      className={styles.shadow}
      style={{ width: spread, height, opacity, zIndex: groundLayer, transform: `translate3d(${x - spread / 2}px, ${y - height / 2}px, 0)` }}
    />
  )
}

export default memo(DragShadow)
