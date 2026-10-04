import { memo, type PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'motion/react'
import type { ShopItemId } from '../../game/types'
import type { ShopCellState } from '../../hooks/useItemSpawner'
import LockBadge from '../LockBadge/LockBadge'
import PriceChip from '../Wallet/PriceChip'
import ItemIcon from './ItemIcon'
import { shopItemLabels } from './itemCatalog'
import styles from './ItemDrawer.module.css'

interface CellHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onPointerCancel: () => void
}

interface ShopCellProps {
  cell: ShopCellState
  wallet: number
  goal: boolean
  denied: boolean
  dragging: boolean
  handlers: CellHandlers
}

const goalRadius = 17
const goalLength = 2 * Math.PI * goalRadius

function ShopCell({ cell, wallet, goal, denied, dragging, handlers }: ShopCellProps) {
  const tierLocked = cell.blocker === 'tierLocked'
  const capped = cell.blocker === 'capReached' || cell.blocker === 'alreadyOwned'
  const affordable = cell.blocker === null
  const label = shopItemLabels[cell.id] ?? cell.id
  return (
    <button
      type="button"
      role="menuitem"
      className={styles.item}
      data-shop-item={cell.id}
      data-price={cell.price}
      data-affordable={affordable}
      data-locked={tierLocked}
      data-capped={capped}
      data-goal={goal}
      data-denied={denied}
      data-dragging={dragging}
      aria-disabled={!affordable}
      aria-label={label}
      title={label}
      {...handlers}>
      {goal && (
        <svg className={styles.goalRing} width={40} height={40} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx={20} cy={20} r={goalRadius} className={styles.goalTrack} />
          <circle cx={20} cy={20} r={goalRadius} className={styles.goalFill} strokeDasharray={goalLength} strokeDashoffset={goalLength * (1 - Math.min(1, wallet / Math.max(1, cell.price)))} transform="rotate(-90 20 20)" />
        </svg>
      )}
      <motion.span className={styles.glyph} whileHover={affordable ? { y: -2, rotate: -4 } : undefined} transition={{ type: 'spring', stiffness: 520, damping: 18 }}>
        <ItemIcon id={cell.id as ShopItemId} />
      </motion.span>
      <span className={styles.chipSlot}>{tierLocked ? <LockBadge progress={cell.tierProgress} size={13} /> : capped ? <span className={styles.capDot} /> : <PriceChip price={cell.price} affordable={affordable} />}</span>
    </button>
  )
}

export default memo(ShopCell)
