import type { PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'motion/react'
import type { ShopOffer } from '../../game/types'
import PriceChip from '../Wallet/PriceChip'
import LockBadge from '../LockBadge/LockBadge'
import CareItemIcon from './CareItemIcon'
import styles from './CareTray.module.css'

interface CollarBinding {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerCancel: () => void
}

interface CollarSlotProps {
  offer: ShopOffer | null
  ready: boolean
  armed: boolean
  denied: boolean
  buying: boolean
  dragging: boolean
  bind: CollarBinding | null
  onBuy: () => void
}

const ringRadius = 18
const ringLength = 2 * Math.PI * ringRadius

function stopPress(event: ReactPointerEvent<HTMLButtonElement>): void {
  event.stopPropagation()
}

export default function CollarSlot({ offer, ready, armed, denied, buying, dragging, bind, onBuy }: CollarSlotProps) {
  if (ready && bind) {
    return (
      <motion.button
        key="collar-ready"
        type="button"
        className={styles.collar}
        data-ready="true"
        data-armed={armed}
        data-denied={denied}
        data-dragging={dragging}
        data-care-kind="collar"
        aria-label="Collar"
        aria-pressed={armed}
        title="Collar"
        initial={{ scale: 0.3, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 460, damping: 14 }}
        {...bind}>
        <CareItemIcon kind="collar" size={30} />
      </motion.button>
    )
  }
  if (!offer) return null
  const tierLocked = !offer.tierOpen
  const filled = Math.min(1, Math.max(0, tierLocked ? offer.tierProgress : offer.affordProgress))
  const affordable = offer.blocker === null
  return (
    <motion.button
      key="collar-shop"
      type="button"
      className={styles.collar}
      data-ready="false"
      data-shop-item="collar"
      data-price={offer.price}
      data-affordable={affordable}
      data-buying={buying}
      data-denied={denied}
      aria-label="Collar"
      onPointerDown={stopPress}
      onClick={onBuy}
      animate={{ scale: buying ? 1.08 : 1 }}
      transition={{ type: 'spring', stiffness: 480, damping: 18 }}>
      <svg className={styles.collarRing} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx={20} cy={20} r={ringRadius} className={styles.ringTrack} />
        <motion.circle
          cx={20}
          cy={20}
          r={ringRadius}
          className={styles.collarFill}
          data-tier-locked={tierLocked}
          strokeDasharray={ringLength}
          initial={false}
          animate={{ strokeDashoffset: ringLength * (1 - filled) }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        />
      </svg>
      <motion.span className={styles.collarGlyph} data-affordable={affordable} animate={buying ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }} transition={buying ? { duration: 0.6, repeat: Infinity } : { duration: 0.2 }}>
        <CareItemIcon kind="collar" size={24} />
      </motion.span>
      {tierLocked ? (
        <LockBadge progress={offer.tierProgress} size={14} />
      ) : (
        <span className={styles.collarPrice}>
          <PriceChip price={offer.price} affordable={affordable} armed={buying} denied={denied} />
        </span>
      )}
    </motion.button>
  )
}
