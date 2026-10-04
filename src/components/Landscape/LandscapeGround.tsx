import { memo, useMemo, useState, type CSSProperties } from 'react'
import { PATH_CELL_COUNT, pathStyleOfCode } from '../../game/landscape/pathGrid'
import type { PathStyle } from '../../game/landscape/landscapeTypes'
import { burstSpecks, cellDetail, cellPoint, createPathFrame, mergeDetails, pathPalettes, staticStrokes, tileStrokes, type CellDetail, type PathFrame, type StrokeBucket } from './pathShapes'
import styles from './Landscape.module.css'

interface LandscapeGroundProps {
  pathCells: readonly number[]
  width: number
  height: number
}

interface TileChange {
  key: string
  cell: number
  style: PathStyle
  order: number
}

interface GroundChanges {
  cells: readonly number[]
  fresh: TileChange[]
  ghosts: TileChange[]
  serial: number
}

const staggerMs = 30
const changeMemory = 48
const edgeWidth = 2.6

function diffCells(previous: readonly number[], next: readonly number[], serial: number): { fresh: TileChange[]; ghosts: TileChange[] } {
  const fresh: TileChange[] = []
  const ghosts: TileChange[] = []
  for (let cell = 0; cell < PATH_CELL_COUNT; cell += 1) {
    const before = pathStyleOfCode(previous[cell] ?? 0)
    const after = pathStyleOfCode(next[cell] ?? 0)
    if (before === after) continue
    if (after) fresh.push({ key: `t${serial}-${cell}`, cell, style: after, order: fresh.length })
    else if (before) ghosts.push({ key: `g${serial}-${cell}`, cell, style: before, order: ghosts.length })
  }
  return { fresh, ghosts }
}

function absorbChanges(changes: GroundChanges, next: readonly number[]): GroundChanges {
  const serial = changes.serial + 1
  const { fresh, ghosts } = diffCells(changes.cells, next, serial)
  const touched = new Set([...fresh, ...ghosts].map((change) => change.cell))
  return {
    cells: next,
    serial,
    fresh: [...changes.fresh.filter((change) => !touched.has(change.cell)), ...fresh].slice(-changeMemory),
    ghosts: [...changes.ghosts.filter((change) => !touched.has(change.cell)), ...ghosts].slice(-changeMemory),
  }
}

function Strokes({ buckets, layer }: { buckets: StrokeBucket[]; layer: 'edge' | 'fill' | 'sheen' }) {
  return (
    <>
      {buckets.map((bucket) => {
        const palette = pathPalettes[bucket.style]
        const width = layer === 'edge' ? bucket.width + edgeWidth * 2 : layer === 'fill' ? bucket.width : bucket.width * 0.42
        return (
          <path
            key={bucket.key}
            d={bucket.segments}
            stroke={palette[layer]}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )
      })}
    </>
  )
}

function Details({ detail }: { detail: CellDetail }) {
  return (
    <>
      {detail.slabs.map((slab, index) => (
        <g key={index}>
          <path d={slab.path} fill="#e4dfd3" stroke="#aaa18f" strokeWidth={1} strokeLinejoin="round" />
          <path d={slab.highlight} stroke="#f6f3ec" strokeWidth={1.1} strokeLinecap="round" fill="none" />
        </g>
      ))}
      {detail.specks.map((speck) => (
        <path key={speck.tone} d={speck.path} fill={speck.tone} />
      ))}
    </>
  )
}

function tileStyle(frame: PathFrame, change: TileChange): CSSProperties {
  const center = cellPoint(frame, change.cell)
  return { translate: `${center.x}px ${center.y}px`, animationDelay: `${change.order * staggerMs}ms` }
}

function tileClass(change: TileChange, ghost: boolean): string {
  if (ghost) return `${styles.tile} ${styles.tileSink}`
  return `${styles.tile} ${change.style === 'stone' ? styles.tileDrop : styles.tileStamp}`
}

interface TileLayerProps {
  frame: PathFrame
  cells: readonly number[]
  changes: TileChange[]
  ghost: boolean
  layer: 'edge' | 'fill' | 'sheen' | 'detail' | 'burst'
}

function TileLayer({ frame, cells, changes, ghost, layer }: TileLayerProps) {
  return (
    <>
      {changes.map((change) => {
        if (layer === 'burst') {
          return burstSpecks(change.cell, change.style, frame).map((speck, index) => {
            const center = cellPoint(frame, change.cell)
            const style = {
              translate: `${center.x}px ${center.y}px`,
              animationDelay: `${change.order * staggerMs + 40}ms`,
              '--speck-x': `${speck.x.toFixed(1)}px`,
              '--speck-y': `${speck.y.toFixed(1)}px`,
            } as CSSProperties
            return <circle key={`${change.key}-${index}`} className={styles.speck} style={style} r={speck.size} fill={speck.tone} />
          })
        }
        return (
          <g key={change.key} className={tileClass(change, ghost)} style={tileStyle(frame, change)}>
            {layer === 'detail' ? (
              <Details detail={cellDetail(frame, change.cell, change.style, true)} />
            ) : (
              <Strokes buckets={tileStrokes(frame, cells, change.cell, change.style, !ghost)} layer={layer} />
            )}
          </g>
        )
      })}
    </>
  )
}

function LandscapeGround({ pathCells, width, height }: LandscapeGroundProps) {
  const [changes, setChanges] = useState<GroundChanges>(() => ({ cells: pathCells, fresh: [], ghosts: [], serial: 0 }))
  if (changes.cells !== pathCells) setChanges(absorbChanges(changes, pathCells))
  const frame = useMemo(() => createPathFrame(width, height), [width, height])
  const live = useMemo(() => changes.fresh.filter((change) => pathStyleOfCode(pathCells[change.cell] ?? 0) === change.style), [changes.fresh, pathCells])
  const liveCells = useMemo(() => new Set(live.map((change) => change.cell)), [live])
  const strokes = useMemo(() => staticStrokes(frame, pathCells, liveCells), [frame, pathCells, liveCells])
  const detail = useMemo(
    () =>
      mergeDetails(
        pathCells.flatMap((code, cell) => {
          const style = pathStyleOfCode(code)
          return style && !liveCells.has(cell) ? [cellDetail(frame, cell, style, false)] : []
        }),
      ),
    [frame, pathCells, liveCells],
  )
  const ghosts = changes.ghosts.filter((change) => !pathStyleOfCode(pathCells[change.cell] ?? 0))
  if (strokes.length === 0 && live.length === 0 && ghosts.length === 0) return null

  return (
    <svg className={styles.ground} width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" data-path-tiles={pathCells.filter((code) => code > 0).length}>
      <Strokes buckets={strokes} layer="edge" />
      <TileLayer frame={frame} cells={pathCells} changes={live} ghost={false} layer="edge" />
      <Strokes buckets={strokes} layer="fill" />
      <TileLayer frame={frame} cells={pathCells} changes={live} ghost={false} layer="fill" />
      <g opacity={0.5}>
        <Strokes buckets={strokes} layer="sheen" />
        <TileLayer frame={frame} cells={pathCells} changes={live} ghost={false} layer="sheen" />
      </g>
      <Details detail={detail} />
      <TileLayer frame={frame} cells={pathCells} changes={live} ghost={false} layer="detail" />
      <TileLayer frame={frame} cells={pathCells} changes={ghosts} ghost layer="edge" />
      <TileLayer frame={frame} cells={pathCells} changes={ghosts} ghost layer="fill" />
      <TileLayer frame={frame} cells={pathCells} changes={ghosts} ghost layer="detail" />
      <TileLayer frame={frame} cells={pathCells} changes={live} ghost={false} layer="burst" />
    </svg>
  )
}

export default memo(LandscapeGround)
