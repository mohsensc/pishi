import { memo, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import TennisBallGraphic from '../TennisBall/TennisBallGraphic'
import styles from './Hud.module.css'

interface HudProps {
  poppedCount: number
}

const hintDurationMs = 5200

function useTimedFlag(durationMs: number, trigger: string | number): boolean {
  const [expiredTrigger, setExpiredTrigger] = useState<string | number | null>(null)
  useEffect(() => {
    const timeout = window.setTimeout(() => setExpiredTrigger(trigger), durationMs)
    return () => window.clearTimeout(timeout)
  }, [durationMs, trigger])
  return expiredTrigger !== trigger
}

function Hud({ poppedCount }: HudProps) {
  const hintTimerVisible = useTimedFlag(hintDurationMs, 'hint')
  const showHint = hintTimerVisible && poppedCount === 0

  return (
    <div className={styles.hud}>
      <div className={styles.scoreRow}>
        <TennisBallGraphic size={18} spin={0.4} />
        <span className={styles.countWindow}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={poppedCount}
              className={styles.count}
              initial={{ y: 14, opacity: 0, scale: 1.3 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
            >
              {poppedCount}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <AnimatePresence>
        {showHint && (
          <motion.div
            className={styles.hint}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            pop a loose ball
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default memo(Hud)
