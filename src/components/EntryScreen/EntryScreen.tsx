import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { displayNameOf, isValidOwner, MAX_NAME_PART_LENGTH, type ParkOwner } from '../../../shared/parkName'
import type { ViewportSize } from '../../hooks/useViewportSize'
import Scenery from '../Scenery/Scenery'
import ArrowGlyph from './ArrowGlyph'
import CatMark from './CatMark'
import styles from './EntryScreen.module.css'

interface EntryScreenProps {
  viewportSize: ViewportSize
  rememberedOwner: ParkOwner | null
  busy: boolean
  onEnter: (owner: ParkOwner) => void
}

const morningSky = 0.32
const swap = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 }, transition: { duration: 0.18, ease: 'easeOut' } } as const

function initialsOf(owner: ParkOwner): string {
  return `${owner.first.trim().charAt(0)}${owner.last.trim().charAt(0)}`.toUpperCase()
}

export default function EntryScreen({ viewportSize, rememberedOwner, busy, onEnter }: EntryScreenProps) {
  const [choosing, setChoosing] = useState(rememberedOwner === null)
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const typedOwner = { first, last }
  const ready = isValidOwner(typedOwner) && !busy

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (ready) onEnter(typedOwner)
  }

  return (
    <div className={styles.screen} data-entry-screen>
      <div className={styles.backdrop}>
        <Scenery width={viewportSize.width} height={viewportSize.height} skyTime={morningSky} />
      </div>
      <motion.main className={styles.panel} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: 'easeOut' }}>
        <CatMark />
        <AnimatePresence mode="wait" initial={false}>
          {!choosing && rememberedOwner ? (
            <motion.div key="continue" className={styles.stack} {...swap}>
              <button type="button" className={styles.primary} data-busy={busy} disabled={busy} onClick={() => onEnter(rememberedOwner)}>
                <span className={styles.initials}>{initialsOf(rememberedOwner)}</span>
                <span className={styles.label}>
                  Continue as <strong>{displayNameOf(rememberedOwner)}</strong>
                </span>
                <span className={styles.trail}>{busy ? <span className={styles.spinner} /> : <ArrowGlyph />}</span>
              </button>
              <button type="button" className={styles.quiet} disabled={busy} onClick={() => setChoosing(true)}>
                Someone else
              </button>
            </motion.div>
          ) : (
            <motion.form key="names" className={styles.stack} onSubmit={handleSubmit} {...swap}>
              <div className={styles.nameRow}>
                <input
                  className={styles.field}
                  value={first}
                  onChange={(event) => setFirst(event.target.value)}
                  placeholder="First name"
                  aria-label="First name"
                  autoComplete="given-name"
                  maxLength={MAX_NAME_PART_LENGTH}
                  autoFocus
                  data-name-field="first"
                />
                <input
                  className={styles.field}
                  value={last}
                  onChange={(event) => setLast(event.target.value)}
                  placeholder="Last name"
                  aria-label="Last name"
                  autoComplete="family-name"
                  maxLength={MAX_NAME_PART_LENGTH}
                  data-name-field="last"
                />
                <button type="submit" className={styles.go} data-busy={busy} disabled={!ready} aria-label="Enter park">
                  {busy ? <span className={styles.spinner} /> : <ArrowGlyph />}
                </button>
              </div>
              {rememberedOwner && (
                <button type="button" className={styles.quiet} disabled={busy} onClick={() => setChoosing(false)}>
                  {displayNameOf(rememberedOwner)}
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  )
}
