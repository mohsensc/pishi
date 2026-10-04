import { memo } from 'react'
import { motion } from 'motion/react'
import TokenGlyph from './TokenGlyph'
import styles from './Wallet.module.css'

interface PriceChipProps {
  price: number
  affordable: boolean
  progress?: number | null
  armed?: boolean
  denied?: boolean
  size?: 'small' | 'regular'
  className?: string
}

const ringRadius = 5.2
const ringLength = 2 * Math.PI * ringRadius

function formatPrice(price: number): string {
  return price >= 10_000 ? `${Math.round(price / 1000)}k` : String(price)
}

function PriceChip({ price, affordable, progress = null, armed = false, denied = false, size = 'small', className }: PriceChipProps) {
  const glyphSize = size === 'small' ? 9 : 11
  const filled = progress === null ? null : Math.min(1, Math.max(0, progress))
  return (
    <motion.span
      className={className ? `${styles.priceChip} ${className}` : styles.priceChip}
      data-affordable={affordable}
      data-armed={armed}
      data-denied={denied}
      data-size={size}
      data-price={price}
      animate={denied ? { x: [0, -4, 4, -4, 4, 0] } : armed ? { scale: [1, 1.16, 1] } : { x: 0, scale: 1 }}
      transition={denied ? { duration: 0.32 } : armed ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 500, damping: 30 }}>
      <span className={styles.chipGlyph}>
        <TokenGlyph size={glyphSize} muted={!affordable} />
        {filled !== null && (
          <svg className={styles.chipRing} viewBox="0 0 14 14" aria-hidden="true">
            <circle cx={7} cy={7} r={ringRadius} className={styles.chipRingTrack} />
            <circle cx={7} cy={7} r={ringRadius} className={styles.chipRingFill} strokeDasharray={ringLength} strokeDashoffset={ringLength * (1 - filled)} transform="rotate(-90 7 7)" />
          </svg>
        )}
      </span>
      <span className={styles.chipAmount}>{formatPrice(price)}</span>
    </motion.span>
  )
}

export default memo(PriceChip)
