import { memo, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { ShopItemId } from '../../game/types'
import { shopTabs, type ShopTab } from './itemCatalog'
import ItemIcon from './ItemIcon'
import PlacementGhost from './PlacementGhost'
import ShopCell from './ShopCell'
import ShopTabIcon from './ShopTabIcon'
import { useSpawnGesture, type SpawnRequest } from './useSpawnGesture'
import styles from './ItemDrawer.module.css'

interface ItemDrawerProps {
  open: boolean
  propsFull?: boolean
  toysFull?: boolean
  onSpawn: SpawnRequest
  progressPoints?: number
}

const tabStorageKey = 'catPark.shopTab'

function readStoredTab(): ShopTab {
  try {
    const stored = window.localStorage.getItem(tabStorageKey)
    return shopTabs.some((entry) => entry.tab === stored) ? (stored as ShopTab) : 'static'
  } catch {
    return 'static'
  }
}

function storeTab(tab: ShopTab): void {
  try {
    window.localStorage.setItem(tabStorageKey, tab)
  } catch {
    return
  }
}

function tabHasAffordable(items: ShopItemId[], shop: SpawnRequest): boolean {
  return items.some((id) => shop.cells[id]?.blocker === null)
}

function tabGoalOf(items: ShopItemId[], shop: SpawnRequest): ShopItemId | null {
  const waiting = items.flatMap((id) => {
    const cell = shop.cells[id]
    return cell?.blocker === 'insufficientFunds' ? [cell] : []
  })
  waiting.sort((first, second) => first.price - second.price)
  return waiting[0]?.id ?? null
}

function ItemDrawer({ open, onSpawn: shop }: ItemDrawerProps) {
  const [tab, setTab] = useState<ShopTab>(readStoredTab)
  const { ghost, placing, deniedId, deniedAt, bindCell, overlayHandlers } = useSpawnGesture(shop, open)
  const activeTab = shopTabs.find((entry) => entry.tab === tab) ?? shopTabs[0]
  const handlers = useMemo(() => Object.fromEntries(shopTabs.flatMap((entry) => entry.items).map((id) => [id, bindCell(id)])), [bindCell])
  const stage = shop.stage()
  const goal = tabGoalOf(activeTab.items, shop)
  const ghostCell = ghost ? shop.cells[ghost.itemId] : undefined
  const chooseTab = (next: ShopTab) => {
    setTab(next)
    storeTab(next)
  }
  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.tray}
            data-ui
            data-placing={placing !== null}
            role="menu"
            aria-label="Shop"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: placing ? 0 : 1, scale: placing ? 0.96 : 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}>
            <div className={styles.tabs} role="tablist">
              {shopTabs.map((entry) => (
                <button
                  key={entry.tab}
                  type="button"
                  role="tab"
                  className={styles.tab}
                  data-shop-tab={entry.tab}
                  data-active={entry.tab === tab}
                  data-ready={entry.tab !== tab && tabHasAffordable(entry.items, shop)}
                  aria-selected={entry.tab === tab}
                  aria-label={entry.label}
                  title={entry.label}
                  onClick={() => chooseTab(entry.tab)}>
                  {entry.tab === tab && <motion.span layoutId="shopTabPill" className={styles.tabPill} transition={{ type: 'spring', stiffness: 520, damping: 36 }} />}
                  <ShopTabIcon tab={entry.tab} />
                </button>
              ))}
            </div>
            <motion.div key={activeTab.tab} className={styles.grid} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}>
              {activeTab.items.map((id) => {
                const cell = shop.cells[id]
                if (!cell) return null
                return <ShopCell key={id} cell={cell} wallet={shop.wallet} goal={goal === id} denied={deniedId === id} dragging={ghost?.itemId === id || placing === id} handlers={handlers[id]} />
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {placing &&
        createPortal(
          <div className={styles.placementOverlay} data-ui data-placing-item={placing} {...overlayHandlers} />,
          document.body,
        )}
      {ghost?.preview && ghostCell && stage && <PlacementGhost preview={ghost.preview} price={ghostCell.price} affordable={ghostCell.blocker === null} deniedAt={deniedId === ghost.itemId ? deniedAt : 0} stage={stage} />}
      {ghost && !ghost.preview && !placing &&
        createPortal(
          <div className={styles.ghost} data-over-interface={ghost.overInterface} style={{ transform: `translate3d(${ghost.client.x}px, ${ghost.client.y}px, 0)` }} aria-hidden="true">
            <ItemIcon id={ghost.itemId} size={40} />
            <span className={styles.ghostShadow} />
          </div>,
          document.body,
        )}
    </>
  )
}

export default memo(ItemDrawer)
