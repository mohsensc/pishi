import { memo, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CARE_TRAY_CAPACITY } from '../../game/care/careCatalog'
import { fulfillsNeed } from '../../game/needs/needCare'
import type { CareItemKind, CareState, ShopOffer, TrayItemKind } from '../../game/types'
import type { CarePresenter } from '../../hooks/useCarePresenter'
import { useArmedPurchase } from '../../hooks/useArmedPurchase'
import { offerSignature } from '../../game/economy/shopOffers'
import CareItemIcon from './CareItemIcon'
import CatchMeter from './CatchMeter'
import CollarSlot from './CollarSlot'
import { useCareGesture, type TrayEntry } from './useCareGesture'
import styles from './CareTray.module.css'

interface CareTrayProps {
  care: CareState
  presenter: CarePresenter
  collarOffer: ShopOffer | null
  collarReady: boolean
  onBuyCollar: () => boolean
  requestedKinds: string
  onDiscard: (item: TrayEntry) => boolean
  onDragChange: (dragging: boolean) => void
}

const itemLabels: Record<TrayItemKind, string> = {
  fish: 'Fish',
  milk: 'Milk',
  yarn: 'Yarn',
  brush: 'Brush',
  treat: 'Star treat',
  collar: 'Collar',
}

const collarEntry: TrayEntry = { id: 'collar', kind: 'collar' }

function stopStagePointer(event: PointerEvent<HTMLElement>): void {
  event.stopPropagation()
}

function parseRequests(requestedKinds: string): CareItemKind[] {
  return requestedKinds ? (requestedKinds.split(',') as CareItemKind[]) : []
}

function CareTray({ care, presenter, collarOffer, collarReady, onBuyCollar, requestedKinds, onDiscard, onDragChange }: CareTrayProps) {
  const entries: TrayEntry[] = collarReady ? [...care.inventory, collarEntry] : care.inventory
  const { ghost, armedId, deniedId, bindItem } = useCareGesture({ presenter, entries, onDiscard, onDragChange })
  const collarPurchase = useArmedPurchase()
  const buyCollar = () => {
    if (collarOffer) collarPurchase.tap('collar', collarOffer, onBuyCollar)
  }
  const full = care.inventory.length >= CARE_TRAY_CAPACITY
  const openSlots = Math.max(0, CARE_TRAY_CAPACITY - care.inventory.length)
  const requests = parseRequests(requestedKinds)
  const isWanted = (kind: CareItemKind) => requests.some((want) => fulfillsNeed(want, kind))

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
                data-care-kind={item.kind}
                data-armed={armedId === item.id}
                data-denied={deniedId === item.id}
                data-wanted={isWanted(item.kind)}
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
        {(collarReady || collarOffer) && <span className={styles.divider} aria-hidden="true" />}
        {(collarReady || collarOffer) && (
          <CollarSlot
            offer={collarOffer}
            ready={collarReady}
            armed={armedId === collarEntry.id}
            denied={deniedId === collarEntry.id || collarPurchase.deniedKey === 'collar'}
            buying={collarPurchase.armedKey === 'collar'}
            dragging={ghost?.dragging === true && ghost.itemId === collarEntry.id}
            bind={collarReady ? bindItem(collarEntry) : null}
            onBuy={buyCollar}
          />
        )}
      </div>
      {ghost &&
        createPortal(
          <div
            className={styles.ghost}
            data-over-cat={ghost.overCat}
            data-over-trash={ghost.overTrash}
            data-dragging={ghost.dragging}
            style={{ transform: `translate3d(${ghost.position.x}px, ${ghost.position.y}px, 0)` }}
            aria-hidden="true">
            <CareItemIcon kind={ghost.kind} size={ghost.dragging ? 44 : 30} />
          </div>,
          document.body,
        )}
    </>
  )
}

function collarSignature(offer: ShopOffer | null): string {
  return offer ? offerSignature(offer) : ''
}

function areCareTrayPropsEqual(previous: CareTrayProps, next: CareTrayProps): boolean {
  const before = previous.care
  const after = next.care
  return (
    previous.presenter === next.presenter &&
    previous.onDiscard === next.onDiscard &&
    previous.onDragChange === next.onDragChange &&
    previous.collarReady === next.collarReady &&
    previous.onBuyCollar === next.onBuyCollar &&
    collarSignature(previous.collarOffer) === collarSignature(next.collarOffer) &&
    previous.requestedKinds === next.requestedKinds &&
    before.meter === after.meter &&
    before.lastReward?.id === after.lastReward?.id &&
    before.inventory.length === after.inventory.length &&
    before.inventory.every((item, index) => item.id === after.inventory[index].id)
  )
}

export default memo(CareTray, areCareTrayPropsEqual)
