import { memo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { drawerEntries } from './itemCatalog'
import ItemIcon from './ItemIcon'
import { useSpawnGesture, type SpawnRequest } from './useSpawnGesture'
import styles from './ItemDrawer.module.css'

interface ItemDrawerProps {
  open: boolean
  propsFull: boolean
  toysFull: boolean
  onSpawn: SpawnRequest
}

function ItemDrawer({ open, propsFull, toysFull, onSpawn }: ItemDrawerProps) {
  const { ghost, deniedKey, bindEntry } = useSpawnGesture(onSpawn)
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.tray}
            data-ui
            role="menu"
            aria-label="Add items"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}>
            {drawerEntries.map((entry) => {
              const full = entry.item.category === 'prop' ? propsFull : toysFull
              return (
                <button
                  key={entry.key}
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  data-full={full}
                  data-denied={deniedKey === entry.key}
                  data-dragging={ghost?.entry.key === entry.key}
                  aria-label={entry.label}
                  title={entry.label}
                  {...bindEntry(entry)}>
                  <ItemIcon item={entry.item} />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {ghost &&
        createPortal(
          <div className={styles.ghost} style={{ transform: `translate3d(${ghost.position.x}px, ${ghost.position.y}px, 0)` }} aria-hidden="true">
            <ItemIcon item={ghost.entry.item} size={44} />
            <span className={styles.ghostShadow} />
          </div>,
          document.body,
        )}
    </>
  )
}

export default memo(ItemDrawer)
