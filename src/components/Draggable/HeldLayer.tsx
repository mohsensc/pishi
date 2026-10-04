import type { ReactNode } from 'react'
import styles from './Draggable.module.css'

interface HeldLayerProps {
  held: boolean
  children: ReactNode
}

const heldLayer = 150000

export default function HeldLayer({ held, children }: HeldLayerProps) {
  return (
    <div className={held ? styles.held : styles.resting} style={held ? { zIndex: heldLayer } : undefined}>
      {children}
    </div>
  )
}
