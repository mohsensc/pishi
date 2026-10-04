import { AnimatePresence, motion } from 'motion/react'
import type { CareReward } from '../../game/types'
import TennisBallGraphic from '../TennisBall/TennisBallGraphic'
import styles from './CareTray.module.css'

interface CatchMeterProps {
  progress: number
  full: boolean
  reward: CareReward | null
}

const ringRadius = 17
const ringLength = Math.PI * 2 * ringRadius

export default function CatchMeter({ progress, full, reward }: CatchMeterProps) {
  const filled = Math.min(1, Math.max(0, progress))
  return (
    <div className={styles.meter} data-full={full} aria-label="Catch meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(filled * 100)}>
      <svg className={styles.ring} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx={20} cy={20} r={ringRadius} className={styles.ringTrack} />
        <motion.circle
          cx={20}
          cy={20}
          r={ringRadius}
          className={styles.ringFill}
          strokeDasharray={ringLength}
          initial={false}
          animate={{ strokeDashoffset: ringLength * (1 - filled) }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        />
      </svg>
      <motion.span
        key={reward?.id ?? 'idle'}
        className={styles.meterBall}
        initial={reward ? { scale: reward.catchKind === 'stolen' ? 1.45 : 1.25, rotate: -30 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 14 }}>
        <TennisBallGraphic size={20} spin={0.4} />
      </motion.span>
      <AnimatePresence>
        {reward && reward.catchKind === 'stolen' && (
          <motion.span
            key={`steal-${reward.id}`}
            className={styles.stealBadge}
            initial={{ opacity: 0, scale: 0.4, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: 1, y: -10 }}
            transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1] }}>
            ×2
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {reward?.unlockedKind && (
          <motion.span
            key={`unlock-${reward.id}`}
            className={styles.unlockBurst}
            initial={{ opacity: 0.9, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
