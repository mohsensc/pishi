import { memo } from 'react'
import { motion } from 'motion/react'
import type { CatState } from '../../game/types'
import { depthScale, toScreen } from '../../game/projection'
import AffectionHearts from './AffectionHearts'
import BreedGlyph from './BreedGlyph'
import MoodGlyph from './MoodGlyph'
import { moodLabels, moodOf } from './catMood'
import styles from './CatCard.module.css'

interface CatCardProps {
  cat: CatState
  worldHeight: number
}

const breedLabels: Record<CatState['coat']['breed'], string> = {
  tuxedo: 'Tuxedo',
  munchkin: 'Munchkin',
  persian: 'Persian',
  egyptianMau: 'Egyptian Mau',
}

const needBubbleClearance = 46

function CatCard({ cat, worldHeight }: CatCardProps) {
  const head = toScreen(cat.position, cat.height)
  const lift = 78 * cat.coat.scale * depthScale(cat.position.y, worldHeight) + (cat.need ? needBubbleClearance : 0)
  const mood = moodOf(cat)
  return (
    <div className={styles.anchor} style={{ transform: `translate3d(${Math.round(head.x)}px, ${Math.round(head.y - lift)}px, 0)` }}>
      <motion.div
        className={styles.card}
        role="status"
        aria-label={`${cat.name}, ${breedLabels[cat.coat.breed]}, ${moodLabels[mood]}`}
        initial={{ opacity: 0, y: 4, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}>
        <span className={styles.row}>
          <BreedGlyph coat={cat.coat} />
          <span className={styles.name}>{cat.name}</span>
          <span className={styles.mood} title={moodLabels[mood]}>
            <MoodGlyph mood={mood} />
          </span>
        </span>
        <AffectionHearts affection={cat.affection} />
      </motion.div>
    </div>
  )
}

export default memo(CatCard)
