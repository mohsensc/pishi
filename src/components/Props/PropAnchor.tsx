import type { ReactNode } from 'react'
import styles from './Props.module.css'

interface PropAnchorProps {
  x: number
  y: number
  zIndex: number
  scale: number
  className?: string
  children: ReactNode
}

export default function PropAnchor({ x, y, zIndex, scale, className, children }: PropAnchorProps) {
  const canvasClassName = className ? `${styles.canvas} ${className}` : styles.canvas
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`, zIndex }}>
      <svg className={canvasClassName} width="1" height="1" overflow="visible" aria-hidden="true">
        {children}
      </svg>
    </div>
  )
}
