import { AnimatePresence, motion } from 'motion/react'
import TokenGlyph from '../Wallet/TokenGlyph'
import styles from './ToolDock.module.css'

interface TrashZoneProps {
  over: boolean
  zoneRef: (element: HTMLElement | null) => void
  refund?: number | null
}

export default function TrashZone({ over, zoneRef, refund }: TrashZoneProps) {
  const refused = refund === null
  return (
    <motion.div
      ref={zoneRef}
      data-discard-zone
      className={styles.trash}
      data-over={over}
      data-refused={refused}
      data-refund={typeof refund === 'number' ? refund : undefined}
      role="img"
      aria-label="Drop here to remove"
      initial={{ scale: 0.7, opacity: 0 }}
      animate={refused && over ? { scale: 1.06, opacity: 1, x: [0, -3, 3, -3, 3, 0] } : { scale: over ? 1.14 : 1, opacity: 1, x: 0 }}
      transition={refused && over ? { duration: 0.36 } : { type: 'spring', stiffness: 520, damping: 26 }}>
      {refused ? (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M6.5 17.5l11-11" />
        </svg>
      ) : (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <motion.g animate={{ rotate: over ? -18 : 0, y: over ? -1.5 : 0 }} style={{ originX: '4px', originY: '6px' }}>
            <path d="M3.5 6.5h17" />
            <path d="M9 6.5V4.5h6v2" />
          </motion.g>
          <path d="M5.5 6.5l1 13a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-13" />
          <path d="M10 10.5v6.5M14 10.5v6.5" />
        </svg>
      )}
      <span className={styles.refundAnchor}>
        <AnimatePresence>
          {typeof refund === 'number' && (
            <motion.span
              key="refund"
              className={styles.refundChip}
              data-empty={refund <= 0}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: over ? 1.14 : 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 520, damping: 22 }}>
              <TokenGlyph size={11} muted={refund <= 0} />+{refund}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.div>
  )
}
