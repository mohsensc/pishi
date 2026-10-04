import { memo, useEffect, useState, type PointerEvent } from 'react'
import type { DragTarget, ToolKind } from '../../game/types'
import { toolOrder } from '../../hooks/useTool'
import { useTrashZone } from '../../hooks/useTrashZone'
import ItemDrawer from '../ItemDrawer/ItemDrawer'
import type { SpawnRequest } from '../ItemDrawer/useSpawnGesture'
import AddButton from './AddButton'
import ToolIcon from './ToolIcon'
import TrashZone from './TrashZone'
import styles from './ToolDock.module.css'

interface ToolDockProps {
  tool: ToolKind
  onSelect: (tool: ToolKind) => void
  dragTarget: DragTarget | null
  propsFull: boolean
  toysFull: boolean
  onSpawn: SpawnRequest
  discardHover: boolean
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

function ToolDock({ tool, onSelect, dragTarget, propsFull, toysFull, onSpawn, discardHover }: ToolDockProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const trashing = dragTarget !== null && removableTargets.has(dragTarget)
  const { trashRef, overTrash } = useTrashZone(trashing)

  useEffect(() => {
    if (!drawerOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [drawerOpen])

  return (
    <nav className={styles.dock} data-ui aria-label="Tools" onPointerDown={stopStagePointer}>
      {toolOrder.map((kind, index) => (
        <button
          key={kind}
          type="button"
          className={styles.toolButton}
          data-active={kind === tool}
          aria-pressed={kind === tool}
          aria-label={toolLabels[kind]}
          onClick={() => onSelect(kind)}>
          <ToolIcon tool={kind} />
          <span className={styles.tooltip} role="tooltip">
            {toolLabels[kind]}
            <kbd className={styles.key}>{index + 1}</kbd>
          </span>
        </button>
      ))}
      <span className={styles.divider} aria-hidden="true" />
      {trashing ? (
        <TrashZone over={overTrash || discardHover} zoneRef={trashRef} />
      ) : (
        <AddButton open={drawerOpen} onToggle={() => setDrawerOpen((open) => !open)} />
      )}
      <ItemDrawer open={drawerOpen && !trashing} propsFull={propsFull} toysFull={toysFull} onSpawn={onSpawn} />
    </nav>
  )
}

export default memo(ToolDock)
