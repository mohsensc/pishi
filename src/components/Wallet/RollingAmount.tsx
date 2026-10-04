import { memo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import styles from './Wallet.module.css'

interface RollingAmountProps {
  value: number
}

const digitVariants = {
  enter: (direction: number) => ({ y: direction > 0 ? '70%' : '-70%', opacity: 0, scale: 0.9 }),
  center: { y: '0%', opacity: 1, scale: 1 },
  exit: (direction: number) => ({ y: direction > 0 ? '-70%' : '70%', opacity: 0, scale: 0.9 }),
}

function RollingAmount({ value }: RollingAmountProps) {
  const [rolled, setRolled] = useState({ value, direction: 1 })
  if (rolled.value !== value) setRolled({ value, direction: value > rolled.value ? 1 : -1 })
  const digits = [...String(Math.max(0, Math.floor(value)))]
  return (
    <span className={styles.amount} aria-label={String(value)}>
      {digits.map((digit, index) => {
        const place = digits.length - index
        return (
          <span key={place} className={styles.digitSlot} aria-hidden="true">
            <AnimatePresence mode="popLayout" initial={false} custom={rolled.direction}>
              <motion.span
                key={digit}
                className={styles.digit}
                custom={rolled.direction}
                variants={digitVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 560, damping: 34, mass: 0.6 }}>
                {digit}
              </motion.span>
            </AnimatePresence>
          </span>
        )
      })}
    </span>
  )
}

export default memo(RollingAmount)
