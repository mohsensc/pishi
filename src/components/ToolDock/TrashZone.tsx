import { motion } from 'motion/react'
import styles from './ToolDock.module.css'

interface TrashZoneProps {
  over: boolean
  zoneRef: (element: HTMLElement | null) => void
}

export default function TrashZone({ over, zoneRef }: TrashZoneProps) {
  return (
    <motion.div
      ref={zoneRef}
      data-discard-zone
      className={styles.trash}
      data-over={over}
      role="img"
      aria-label="Drop here to remove"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: over ? 1.14 : 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <motion.g animate={{ rotate: over ? -18 : 0, y: over ? -1.5 : 0 }} style={{ originX: '4px', originY: '6px' }}>
          <path d="M3.5 6.5h17" />
          <path d="M9 6.5V4.5h6v2" />
        </motion.g>
        <path d="M5.5 6.5l1 13a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-13" />
        <path d="M10 10.5v6.5M14 10.5v6.5" />
      </svg>
    </motion.div>
  )
}
