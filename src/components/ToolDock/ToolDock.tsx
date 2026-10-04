import { memo, useEffect, useState, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import type { DragTarget, EconomyState, ShopItemId, ShopOffer, ToolKind } from '../../game/types'
import { toolShopItem } from '../../game/economy/shopOffers'
import { useUnlockFlash } from '../../hooks/useUnlockFlash'
import { useArmedPurchase } from '../../hooks/useArmedPurchase'
import LockBadge from '../LockBadge/LockBadge'
import PriceChip from '../Wallet/PriceChip'
import { toolOrder } from '../../hooks/useTool'
import { useTrashZone } from '../../hooks/useTrashZone'
import ItemDrawer from '../ItemDrawer/ItemDrawer'
import type { SpawnRequest } from '../ItemDrawer/useSpawnGesture'
import AddButton from './AddButton'
import BuildModeButtons from '../Landscape/BuildModeButtons'
import type { BuildModeHandle } from '../../hooks/useBuildMode'
import ToolIcon from './ToolIcon'
import TrashZone from './TrashZone'
import styles from './ToolDock.module.css'

export type ToolOffers = Partial<Record<ToolKind, ShopOffer>>

interface ToolDockProps {
  tool: ToolKind
  onSelect: (tool: ToolKind) => void
  dragTarget: DragTarget | null
  propsFull: boolean
  toysFull: boolean
  onSpawn: SpawnRequest
  discardHover: boolean
  trashActive: boolean
  buildMode: BuildModeHandle
  economy: EconomyState
  toolOffers: ToolOffers
  onBuy: (itemId: ShopItemId) => boolean
  refundPreview: number | null | undefined
}

const toolLabels: Record<ToolKind, string> = {
  hand: 'Hand',
  treat: 'Treat',
  wand: 'Feather wand',
  laser: 'Laser',
  brush: 'Brush',
  catnip: 'Catnip',
}

const removableTargets = new Set<DragTarget>(['prop', 'ball'])

function stopStagePointer(event: PointerEvent<HTMLElement>): void {
  event.stopPropagation()
}

function ToolDock({ tool, onSelect, dragTarget, propsFull, toysFull, onSpawn, discardHover, trashActive, buildMode, economy, toolOffers, onBuy, refundPreview }: ToolDockProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const trashing = trashActive || (dragTarget !== null && removableTargets.has(dragTarget))
  const ownedTools = economy.ownedTools
  const freshTools = useUnlockFlash(ownedTools)
  const { trashRef, overTrash } = useTrashZone(trashing)
  const { armedKey, deniedKey, tap } = useArmedPurchase()
  const building = buildMode.mode.kind !== 'none'

  useEffect(() => {
    if (!drawerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  const selectTool = (kind: ToolKind) => {
    if (building) buildMode.setMode({ kind: 'none' })
    onSelect(kind)
  }

  const chooseTool = (kind: ToolKind) => {
    const offer = toolOffers[kind]
    const itemId = toolShopItem(kind)
    if (kind === 'hand' || ownedTools.includes(kind) || !offer || !itemId) {
      selectTool(kind)
      return
    }
    if (tap(kind, offer, () => onBuy(itemId)) === 'bought') selectTool(kind)
  }

  return (
    <nav className={styles.dock} data-ui aria-label="Tools" onPointerDown={stopStagePointer}>
      {toolOrder.map((kind, index) => {
        const owned = kind === 'hand' || ownedTools.includes(kind)
        const offer = toolOffers[kind]
        const fresh = freshTools.has(kind)
        const armed = armedKey === kind
        return (
          <button
            key={kind}
            type="button"
            className={styles.toolButton}
            data-tool={kind}
            data-active={kind === tool && !building}
            data-locked={!owned}
            data-armed={armed}
            data-denied={deniedKey === kind}
            data-fresh={fresh}
            data-price={!owned && offer ? offer.price : undefined}
            data-affordable={!owned && offer ? offer.blocker === null : undefined}
            aria-pressed={kind === tool && !building}
            aria-label={toolLabels[kind]}
            onClick={() => chooseTool(kind)}>
            <motion.span
              className={styles.glyph}
              key={fresh ? 'fresh' : owned ? 'open' : 'locked'}
              initial={fresh ? { scale: 0.3, rotate: -40, y: 6 } : false}
              animate={{ scale: armed ? 1.08 : 1, rotate: 0, y: armed ? -3 : 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 14 }}>
              <ToolIcon tool={kind} />
            </motion.span>
            {fresh && <motion.span className={styles.unlockRing} initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} aria-hidden="true" />}
            {!owned && offer && !offer.tierOpen && <LockBadge progress={offer.tierProgress} />}
            {!owned && offer && offer.tierOpen && (
              <span className={styles.toolPrice}>
                <PriceChip price={offer.price} affordable={offer.blocker === null} armed={armed} denied={deniedKey === kind} progress={offer.blocker === 'insufficientFunds' ? offer.affordProgress : null} />
              </span>
            )}
            <span className={styles.tooltip} role="tooltip">
              {toolLabels[kind]}
              {owned && <kbd className={styles.key}>{index + 1}</kbd>}
            </span>
          </button>
        )
      })}
      <span className={styles.divider} aria-hidden="true" />
      <BuildModeButtons buildMode={buildMode} economy={economy} />
      {trashing ? (
        <TrashZone over={overTrash || discardHover} zoneRef={trashRef} refund={dragTarget === 'prop' ? refundPreview : undefined} />
      ) : (
        <AddButton open={drawerOpen} onToggle={() => setDrawerOpen((open) => !open)} />
      )}
      <ItemDrawer open={drawerOpen && !trashing} propsFull={propsFull} toysFull={toysFull} onSpawn={onSpawn} />
    </nav>
  )
}

export default memo(ToolDock)
