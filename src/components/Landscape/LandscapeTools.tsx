import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { pathCellCenter, pathCellIndexAt, pathCellSize, pathCellsAlong } from '../../game/landscape/pathGrid'
import { treeAt } from '../../game/landscape/treeHitTest'
import { depthScale } from '../../game/projection'
import type { Vec, World } from '../../game/types'
import type { BuildMode } from '../../hooks/useBuildMode'
import type { WorldActions } from '../../hooks/useWorld'
import { fadedTreeIds } from './canopyFading'
import { CanopyRim } from './TreeArt'
import { treeGeometry } from './treeGeometry'
import { setFadedTrees, setHoveredTree } from './treeHighlights'
import styles from './Landscape.module.css'

interface LandscapeToolsProps {
  mode: BuildMode
  world: World
  actions: WorldActions
}

interface MissRing {
  id: number
  point: Vec
  denied: boolean
}

const deniedCursorMs = 360

function localPoint(event: ReactPointerEvent<HTMLDivElement>): Vec {
  const bounds = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

function TreeRimOverlay({ world, treeId }: { world: World; treeId: string }) {
  const tree = world.props.find((prop) => prop.id === treeId && prop.kind === 'tree')
  if (!tree) return null
  const scale = depthScale(tree.position.y, world.height)
  return (
    <g transform={`translate(${tree.position.x} ${tree.position.y}) scale(${scale}) rotate(2)`}>
      <g className={styles.rim}>
        <CanopyRim geometry={treeGeometry(tree.radius, tree.variant)} id={tree.id} width={2.6 / scale} />
      </g>
    </g>
  )
}

function CellCursor({ world, cell, erasing, denied }: { world: World; cell: number; erasing: boolean; denied: boolean }) {
  const center = pathCellCenter(world.width, world.height, cell)
  const size = pathCellSize(world.width, world.height)
  const tone = erasing ? '#e0574a' : '#ffffff'
  return (
    <g className={styles.cellCursor} data-denied={denied} style={{ translate: `${center.x}px ${center.y}px` }}>
      <rect x={-size.x / 2} y={-size.y / 2} width={size.x} height={size.y} rx={Math.min(size.x, size.y) * 0.32} fill={tone} fillOpacity={0.16} stroke={tone} strokeOpacity={0.9} strokeWidth={1.6} strokeDasharray="4 3" />
    </g>
  )
}

function BuildLayer({ mode, world, actions }: LandscapeToolsProps) {
  const strokeRef = useRef<Vec | null>(null)
  const missSerialRef = useRef(0)
  const deniedTimerRef = useRef<number | null>(null)
  const [hoverTreeId, setHoverTreeId] = useState<string | null>(null)
  const [hoverCell, setHoverCell] = useState<number | null>(null)
  const [cursorDenied, setCursorDenied] = useState(false)
  const [misses, setMisses] = useState<MissRing[]>([])

  useEffect(
    () => () => {
      setHoveredTree(null)
      if (deniedTimerRef.current !== null) window.clearTimeout(deniedTimerRef.current)
    },
    [],
  )

  const hoverTree = (treeId: string | null) => {
    setHoverTreeId(treeId)
    setHoveredTree(treeId)
  }

  const addMiss = (point: Vec, denied: boolean) => {
    missSerialRef.current += 1
    const id = missSerialRef.current
    setMisses((current) => [...current.slice(-5), { id, point, denied }])
  }

  const denyCursor = () => {
    setCursorDenied(true)
    if (deniedTimerRef.current !== null) window.clearTimeout(deniedTimerRef.current)
    deniedTimerRef.current = window.setTimeout(() => setCursorDenied(false), deniedCursorMs)
  }

  const applyStroke = (from: Vec, to: Vec): boolean => {
    const cells = pathCellsAlong(world.width, world.height, from, to)
    if (cells.length === 0) return true
    if (mode.kind === 'erasePath') {
      actions.erasePath(cells)
      return true
    }
    if (mode.kind !== 'paintPath') return true
    const result = actions.paintPath(mode.style, cells)
    if (!result.short) return true
    denyCursor()
    return false
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const point = localPoint(event)
    if (mode.kind === 'clearTrees') {
      const tree = treeAt(world, point)
      if (!tree) {
        addMiss(point, false)
        return
      }
      const result = actions.removeTree(tree.id)
      if (!result.ok) addMiss(point, true)
      hoverTree(null)
      return
    }
    const cell = pathCellIndexAt(world.width, world.height, point)
    if (cell === null) return
    setHoverCell(cell)
    event.currentTarget.setPointerCapture(event.pointerId)
    strokeRef.current = applyStroke(point, point) ? point : null
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const point = localPoint(event)
    if (mode.kind === 'clearTrees') {
      const tree = treeAt(world, point)
      if ((tree?.id ?? null) !== hoverTreeId) hoverTree(tree?.id ?? null)
      return
    }
    const cell = pathCellIndexAt(world.width, world.height, point)
    if (cell !== hoverCell) setHoverCell(cell)
    const last = strokeRef.current
    if (!last) return
    event.stopPropagation()
    strokeRef.current = applyStroke(last, point) ? point : null
  }

  const endStroke = () => {
    strokeRef.current = null
  }

  const leave = () => {
    hoverTree(null)
    setHoverCell(null)
  }

  return (
    <div
      className={styles.toolLayer}
      data-build-mode={mode.kind}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={leave}>
      <svg className={styles.overlay} width={world.width} height={world.height} viewBox={`0 0 ${world.width} ${world.height}`} aria-hidden="true">
        {mode.kind === 'clearTrees' && hoverTreeId && <TreeRimOverlay world={world} treeId={hoverTreeId} />}
        {mode.kind !== 'clearTrees' && hoverCell !== null && <CellCursor world={world} cell={hoverCell} erasing={mode.kind === 'erasePath'} denied={cursorDenied} />}
        {misses.map((miss) => (
          <ellipse
            key={miss.id}
            className={styles.missRing}
            cx={miss.point.x}
            cy={miss.point.y}
            rx={16}
            ry={8}
            fill="none"
            stroke={miss.denied ? '#e0574a' : '#ffffff'}
            strokeWidth={2}
            onAnimationEnd={() => setMisses((current) => current.filter((entry) => entry.id !== miss.id))}
          />
        ))}
      </svg>
    </div>
  )
}

export default function LandscapeTools({ mode, world, actions }: LandscapeToolsProps) {
  const fadedKey = fadedTreeIds(world).join('|')
  useEffect(() => setFadedTrees(fadedKey ? fadedKey.split('|') : []), [fadedKey])
  if (mode.kind === 'none') return null
  return <BuildLayer mode={mode} world={world} actions={actions} />
}
