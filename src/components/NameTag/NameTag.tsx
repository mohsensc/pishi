import { motion } from 'motion/react'
import type { CatState } from '../../game/types'
import { happinessOf } from '../../game/happiness/happiness'
import { bubbleAnchorOf } from '../NeedBubble/bubbleAnchor'
import HappinessGlyph from '../Happiness/HappinessGlyph'
import styles from './NameTag.module.css'

interface NameTagProps {
  cat: CatState
  worldHeight: number
}

const tagGap = 8
const needBubbleClearance = 46

export default function NameTag({ cat, worldHeight }: NameTagProps) {
  const anchor = bubbleAnchorOf(cat, worldHeight)
  const lift = anchor.headTop + tagGap + (cat.need ? needBubbleClearance * Math.max(0.8, anchor.pixelsPerUnit) : 0)
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${Math.round(anchor.x)}px, ${Math.round(anchor.y - lift)}px, 0)` }} data-name-tag={cat.id}>
      <motion.div
        className={styles.tag}
        style={{ borderColor: cat.collar?.color }}
        role="status"
        initial={{ opacity: 0, y: 6, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.5 } }}
        transition={{ type: 'spring', stiffness: 480, damping: 24 }}>
        <span className={styles.dot} style={{ background: cat.collar?.color }} aria-hidden="true" />
        <span className={styles.name}>{cat.name}</span>
        <HappinessGlyph happiness={happinessOf(cat)} size={14} />
      </motion.div>
    </div>
  )
}
