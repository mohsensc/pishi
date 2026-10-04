import type { CSSProperties } from 'react'
import styles from './NeedBubble.module.css'

interface SleepZsProps {
  x: number
  y: number
  size: number
  facing: 1 | -1
}

const zDelays = [0, 0.9, 1.8]

export default function SleepZs({ x, y, size, facing }: SleepZsProps) {
  return (
    <div className={styles.zs} style={{ transform: `translate3d(${x}px, ${y}px, 0)`, '--drift': facing } as CSSProperties} aria-hidden="true">
      {zDelays.map((delay, index) => (
        <svg
          key={delay}
          className={styles.z}
          width={size * (1 - index * 0.18)}
          height={size * (1 - index * 0.18)}
          viewBox="0 0 12 12"
          style={{ animationDelay: `${delay}s` }}>
          <path className={styles.zHalo} d="M2.4 2.6 H9.4 L2.6 9.4 H9.6" />
          <path d="M2.4 2.6 H9.4 L2.6 9.4 H9.6" />
        </svg>
      ))}
    </div>
  )
}
