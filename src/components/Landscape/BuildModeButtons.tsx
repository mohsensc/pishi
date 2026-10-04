import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { EconomyState } from '../../game/types'
import type { ShopItemId } from '../../game/economy/economyTypes'
import { shopEntryOf } from '../../game/economy/shopCatalog'
import { tierOf, tierProgress } from '../../game/economy/pricing'
import { isPathMode, type BuildModeHandle, type PathBrush } from '../../hooks/useBuildMode'
import LockBadge from '../LockBadge/LockBadge'
import TokenGlyph from '../Wallet/TokenGlyph'
import { AxeIcon, EraserSwatch, GravelSwatch, PathBrushIcon, StoneSwatch } from './BuildIcons'
import dockStyles from '../ToolDock/ToolDock.module.css'
import styles from './Landscape.module.css'

interface BuildModeButtonsProps {
  buildMode: BuildModeHandle
  economy: EconomyState
}

const axeItems = new Set<ShopItemId>(['treeCharges'])
const pathItems = new Set<ShopItemId>(['pathGravel', 'pathStone'])
const shake = { x: [0, -4, 4, -4, 4, 0] }
const shakeTransition = { duration: 0.32, ease: 'easeInOut' } as const

function deniedKeyFor(economy: EconomyState, items: ReadonlySet<ShopItemId>, ignoredId: string | null): string | null {
  const event = economy.lastDenied
  if (!event || event.id === ignoredId || !event.itemId || !items.has(event.itemId)) return null
  return event.id
}

function Shaker({ shakeKey, children }: { shakeKey: string | null; children: ReactNode }) {
  return (
    <motion.span key={shakeKey ?? 'calm'} className={styles.shaker} initial={{ x: 0 }} animate={shakeKey ? shake : { x: 0 }} transition={shakeTransition}>
      {children}
    </motion.span>
  )
}

function CountBadge({ count, deniedKey }: { count: number; deniedKey: string | null }) {
  return (
    <motion.span
      key={`${count > 0 ? count : 'empty'}-${deniedKey ?? ''}`}
      className={styles.badge}
      data-empty={count <= 0}
      data-denied={deniedKey !== null}
      initial={{ scale: 1.6, opacity: 0.4 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
      {count > 0 ? count : <TokenGlyph size={11} />}
    </motion.span>
  )
}

interface SwatchProps {
  label: string
  active: boolean
  locked: boolean
  progress: number
  shakeKey: string | null
  onPick: () => void
  children: ReactNode
}

function Swatch({ label, active, locked, progress, shakeKey, onPick, children }: SwatchProps) {
  return (
    <button type="button" className={styles.swatch} aria-label={label} aria-pressed={active} aria-disabled={locked} data-active={active} data-locked={locked} data-swatch={label.toLowerCase()} onClick={onPick}>
      <Shaker shakeKey={shakeKey}>{children}</Shaker>
      {locked && <LockBadge progress={progress} size={13} />}
    </button>
  )
}

function brushStock(economy: EconomyState, brush: PathBrush): number {
  return brush.kind === 'paintPath' ? economy.pathStock[brush.style] : economy.pathStock.gravel + economy.pathStock.stone
}

function brushName(brush: PathBrush): string {
  return brush.kind === 'paintPath' ? brush.style : 'erase'
}

function BuildModeButtons({ buildMode, economy }: BuildModeButtonsProps) {
  const { mode, pathBrush, setMode, toggleMode } = buildMode
  const [swatchesOpen, setSwatchesOpen] = useState(false)
  const [mountedDeniedId] = useState(() => economy.lastDenied?.id ?? null)
  const [stoneTaps, setStoneTaps] = useState(0)
  const pathRef = useRef<HTMLSpanElement>(null)
  const pathActive = isPathMode(mode)
  const stoneTier = shopEntryOf('pathStone').tier
  const stoneLocked = tierOf(economy.lifetimeEarned) < stoneTier
  const stoneProgress = tierProgress(economy.lifetimeEarned, stoneTier)
  const popoverOpen = swatchesOpen && pathActive
  const axeDenied = deniedKeyFor(economy, axeItems, mountedDeniedId)
  const pathDenied = deniedKeyFor(economy, pathItems, mountedDeniedId)

  useEffect(() => {
    if (!popoverOpen) return
    const close = (event: PointerEvent) => {
      if (pathRef.current && event.target instanceof Node && pathRef.current.contains(event.target)) return
      setSwatchesOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSwatchesOpen(false)
    }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [popoverOpen])

  const pressPath = () => {
    if (!pathActive) {
      setMode(pathBrush)
      setSwatchesOpen(false)
      return
    }
    if (popoverOpen) {
      setSwatchesOpen(false)
      setMode({ kind: 'none' })
      return
    }
    setSwatchesOpen(true)
  }

  const pick = (brush: PathBrush) => {
    if (brush.kind === 'paintPath' && brush.style === 'stone' && stoneLocked) {
      setStoneTaps((taps) => taps + 1)
      return
    }
    setMode(brush)
    setSwatchesOpen(false)
  }

  const clearing = mode.kind === 'clearTrees'
  const shownBrush = pathActive ? mode : pathBrush

  return (
    <>
      <button
        type="button"
        className={dockStyles.toolButton}
        data-active={clearing}
        aria-pressed={clearing}
        aria-label="Clear trees"
        data-charges={economy.treeCharges}
        onClick={() => {
          setSwatchesOpen(false)
          toggleMode({ kind: 'clearTrees' })
        }}>
        <Shaker shakeKey={axeDenied}>
          <motion.span key={clearing ? 'swing' : 'rest'} className={dockStyles.glyph} initial={{ rotate: 0 }} animate={{ rotate: clearing ? [0, -24, 8, 0] : 0 }} transition={{ duration: 0.45 }}>
            <AxeIcon />
          </motion.span>
        </Shaker>
        <CountBadge count={economy.treeCharges} deniedKey={axeDenied} />
      </button>
      <span ref={pathRef} className={styles.buildSlot}>
        <button
          type="button"
          className={dockStyles.toolButton}
          data-active={pathActive}
          aria-pressed={pathActive}
          aria-expanded={popoverOpen}
          aria-label="Lay path"
          data-stock={brushStock(economy, shownBrush)}
          data-brush={brushName(shownBrush)}
          onClick={pressPath}>
          <Shaker shakeKey={pathDenied}>
            <motion.span key={brushName(shownBrush)} className={dockStyles.glyph} initial={{ scale: 0.5, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 520, damping: 16 }}>
              <PathBrushIcon brush={shownBrush} />
            </motion.span>
          </Shaker>
          {shownBrush.kind === 'paintPath' && <CountBadge count={economy.pathStock[shownBrush.style]} deniedKey={pathDenied} />}
        </button>
        <AnimatePresence>
          {popoverOpen && (
            <motion.div
              className={styles.swatches}
              role="group"
              aria-label="Path"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 520, damping: 30 }}
              data-swatches>
              <Swatch label="Gravel" active={mode.kind === 'paintPath' && mode.style === 'gravel'} locked={false} progress={1} shakeKey={null} onPick={() => pick({ kind: 'paintPath', style: 'gravel' })}>
                <GravelSwatch />
              </Swatch>
              <Swatch label="Stone" active={mode.kind === 'paintPath' && mode.style === 'stone'} locked={stoneLocked} progress={stoneProgress} shakeKey={stoneTaps > 0 ? `stone${stoneTaps}` : null} onPick={() => pick({ kind: 'paintPath', style: 'stone' })}>
                <StoneSwatch />
              </Swatch>
              <Swatch label="Erase" active={mode.kind === 'erasePath'} locked={false} progress={1} shakeKey={null} onPick={() => pick({ kind: 'erasePath' })}>
                <EraserSwatch />
              </Swatch>
            </motion.div>
          )}
        </AnimatePresence>
      </span>
    </>
  )
}

export default memo(BuildModeButtons)
