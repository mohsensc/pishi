import { memo, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CARE_TRAY_CAPACITY } from '../../game/care/careCatalog'
import type { CareItemKind, CareState } from '../../game/types'
import type { CarePresenter } from '../../hooks/useCarePresenter'
import CareItemIcon from './CareItemIcon'
import CatchMeter from './CatchMeter'
import { useCareGesture } from './useCareGesture'
import styles from './CareTray.module.css'

interface CareTrayProps {
  care: CareState
  presenter: CarePresenter
}

const itemLabels: Record<CareItemKind, string> = {
  fish: 'Fish',
  milk: 'Milk',
  yarn: 'Yarn',
  brush: 'Brush',
  treat: 'Star treat',
}

function stopStagePointer(event: PointerEvent<HTMLElement>): void {
  event.stopPropagation()
}

function CareTray({ care, presenter }: CareTrayProps) {
  const { ghost, armedId, deniedId, bindItem } = useCareGesture(presenter, care.inventory)
  const full = care.inventory.length >= CARE_TRAY_CAPACITY
  const openSlots = Math.max(0, CARE_TRAY_CAPACITY - care.inventory.length)

  return (
    <>
      <div className={styles.tray} data-ui data-care-tray data-armed={armedId !== null} onPointerDown={stopStagePointer}>
        <CatchMeter progress={care.meter} full={full && care.meter >= 1} reward={care.lastReward} />
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.items} role="list" aria-label="Care items">
          <AnimatePresence initial={false} mode="popLayout">
            {care.inventory.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                role="listitem"
                layout
                className={styles.item}
                data-armed={armedId === item.id}
                data-denied={deniedId === item.id}
                data-dragging={ghost?.dragging === true && ghost.itemId === item.id}
                aria-label={itemLabels[item.kind]}
                aria-pressed={armedId === item.id}
                title={itemLabels[item.kind]}
                initial={{ scale: 0, rotate: -25, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.16 } }}
                transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                {...bindItem(item)}>
                <CareItemIcon kind={item.kind} size={28} />
              </motion.button>
            ))}
            {Array.from({ length: openSlots }, (_, index) => (
              <motion.span key={`open-${index}`} layout className={styles.openSlot} aria-hidden="true" />
            ))}
          </AnimatePresence>
        </div>
      </div>
      {ghost &&
        createPortal(
          <div className={styles.ghost} data-over-cat={ghost.overCat} data-dragging={ghost.dragging} style={{ transform: `translate3d(${ghost.position.x}px, ${ghost.position.y}px, 0)` }} aria-hidden="true">
            <CareItemIcon kind={ghost.kind} size={ghost.dragging ? 44 : 30} />
          </div>,
          document.body,
        )}
    </>
  )
}

function areCareTrayPropsEqual(previous: CareTrayProps, next: CareTrayProps): boolean {
  const before = previous.care
  const after = next.care
  return (
    previous.presenter === next.presenter &&
    before.meter === after.meter &&
    before.lastReward?.id === after.lastReward?.id &&
    before.inventory.length === after.inventory.length &&
    before.inventory.every((item, index) => item.id === after.inventory[index].id)
  )
}

export default memo(CareTray, areCareTrayPropsEqual)
