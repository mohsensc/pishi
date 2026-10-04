import { PATH_COLUMNS, PATH_ROWS, pathCellCenter, pathCellSize, pathStyleOfCode } from '../../game/landscape/pathGrid'
import type { PathStyle } from '../../game/landscape/landscapeTypes'
import { depthScale } from '../../game/projection'
import { createSeededRandom } from '../../game/random'
import type { Vec } from '../../game/types'

export interface PathFrame {
  width: number
  height: number
  size: Vec
}

export interface StrokeBucket {
  key: string
  style: PathStyle
  width: number
  segments: string
}

export interface PathPalette {
  edge: string
  fill: string
  sheen: string
  specks: readonly string[]
}

export const pathPalettes: Record<PathStyle, PathPalette> = {
  gravel: { edge: '#d2bb8b', fill: '#e9d8ae', sheen: '#f4e9cb', specks: ['#c9b180', '#f7edd2', '#b89f6e'] },
  stone: { edge: '#a99f8c', fill: '#cfc8b8', sheen: '#ddd7ca', specks: ['#efebe2', '#bdb5a4'] },
}

const forwardLinks: readonly [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [-1, 1],
]

const allLinks: readonly [number, number][] = [...forwardLinks, [-1, 0], [0, -1], [-1, -1], [1, -1]]

export function createPathFrame(width: number, height: number): PathFrame {
  return { width, height, size: pathCellSize(width, height) }
}

export function cellPoint(frame: PathFrame, cell: number): Vec {
  return pathCellCenter(frame.width, frame.height, cell)
}

export function strokeWidthAt(frame: PathFrame, y: number): number {
  const perspective = depthScale(y, frame.height) / 1.1
  return ((frame.size.x + frame.size.y) / 2) * 1.1 * perspective
}

export function neighborOf(cell: number, stepX: number, stepY: number): number | null {
  const column = (cell % PATH_COLUMNS) + stepX
  const row = Math.floor(cell / PATH_COLUMNS) + stepY
  if (column < 0 || column >= PATH_COLUMNS || row < 0 || row >= PATH_ROWS) return null
  return row * PATH_COLUMNS + column
}

function linkStyle(first: PathStyle, second: PathStyle): PathStyle {
  return first === second ? first : 'gravel'
}

function bucketWidth(width: number): number {
  return Math.round(width * 2) / 2
}

function segment(from: Vec, to: Vec): string {
  return `M${from.x.toFixed(1)} ${from.y.toFixed(1)}L${to.x.toFixed(1)} ${to.y.toFixed(1)}`
}

function dot(point: Vec): string {
  return `M${point.x.toFixed(1)} ${point.y.toFixed(1)}l0.01 0`
}

class BucketSet {
  private readonly buckets = new Map<string, { style: PathStyle; width: number; parts: string[] }>()

  add(style: PathStyle, width: number, part: string): void {
    const rounded = bucketWidth(width)
    const key = `${style}:${rounded}`
    const bucket = this.buckets.get(key)
    if (bucket) bucket.parts.push(part)
    else this.buckets.set(key, { style, width: rounded, parts: [part] })
  }

  list(): StrokeBucket[] {
    return [...this.buckets.entries()]
      .map(([key, bucket]) => ({ key, style: bucket.style, width: bucket.width, segments: bucket.parts.join('') }))
      .sort((first, second) => (first.style === second.style ? 0 : first.style === 'gravel' ? -1 : 1))
  }
}

export function staticStrokes(frame: PathFrame, cells: readonly number[], skip: ReadonlySet<number>): StrokeBucket[] {
  const buckets = new BucketSet()
  cells.forEach((code, cell) => {
    const style = pathStyleOfCode(code)
    if (!style || skip.has(cell)) return
    const center = cellPoint(frame, cell)
    buckets.add(style, strokeWidthAt(frame, center.y), dot(center))
    forwardLinks.forEach(([stepX, stepY]) => {
      const neighbor = neighborOf(cell, stepX, stepY)
      if (neighbor === null || skip.has(neighbor)) return
      const neighborStyle = pathStyleOfCode(cells[neighbor] ?? 0)
      if (!neighborStyle) return
      const other = cellPoint(frame, neighbor)
      buckets.add(linkStyle(style, neighborStyle), strokeWidthAt(frame, (center.y + other.y) / 2), segment(center, other))
    })
  })
  return buckets.list()
}

export function tileStrokes(frame: PathFrame, cells: readonly number[], cell: number, style: PathStyle, linked: boolean): StrokeBucket[] {
  const buckets = new BucketSet()
  const center = cellPoint(frame, cell)
  const origin = { x: 0, y: 0 }
  buckets.add(style, strokeWidthAt(frame, center.y), dot(origin))
  if (linked) {
    allLinks.forEach(([stepX, stepY]) => {
      const neighbor = neighborOf(cell, stepX, stepY)
      if (neighbor === null) return
      const neighborStyle = pathStyleOfCode(cells[neighbor] ?? 0)
      if (!neighborStyle) return
      const other = cellPoint(frame, neighbor)
      const halfway = { x: (other.x - center.x) * 0.5, y: (other.y - center.y) * 0.5 }
      buckets.add(linkStyle(style, neighborStyle), strokeWidthAt(frame, (center.y + other.y) / 2), segment(origin, halfway))
    })
  }
  return buckets.list()
}

export interface CellDetail {
  specks: { tone: string; path: string }[]
  slabs: { path: string; highlight: string }[]
}

function circlePath(x: number, y: number, radius: number): string {
  return `M${(x - radius).toFixed(1)} ${y.toFixed(1)}a${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(radius * 2).toFixed(2)} 0a${radius.toFixed(2)} ${radius.toFixed(2)} 0 1 0 ${(-radius * 2).toFixed(2)} 0`
}

function flagstonePath(x: number, y: number, radiusX: number, radiusY: number, spin: number, random: () => number): string {
  const corners = 6
  const points = Array.from({ length: corners }, (_, index) => {
    const angle = spin + (index / corners) * Math.PI * 2
    const wobble = 0.82 + random() * 0.22
    return { x: x + Math.cos(angle) * radiusX * wobble, y: y + Math.sin(angle) * radiusY * wobble }
  })
  return `M${points.map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join('L')}Z`
}

export function cellDetail(frame: PathFrame, cell: number, style: PathStyle, local: boolean): CellDetail {
  const random = createSeededRandom(cell * 7919 + (style === 'stone' ? 104729 : 15485863))
  const center = cellPoint(frame, cell)
  const base = local ? { x: 0, y: 0 } : center
  const perspective = depthScale(center.y, frame.height) / 1.1
  const spanX = frame.size.x * 0.42
  const spanY = frame.size.y * 0.36
  const palette = pathPalettes[style]
  if (style === 'stone') {
    const slabs = [-1, 1].map((side) => {
      const x = base.x + side * spanX * 0.48 + (random() - 0.5) * 3
      const y = base.y + side * spanY * 0.18 * (random() > 0.5 ? 1 : -1)
      const radiusX = spanX * (0.5 + random() * 0.12)
      const radiusY = spanY * (0.62 + random() * 0.14)
      const spin = random() * Math.PI
      return {
        path: flagstonePath(x, y, radiusX, radiusY, spin, random),
        highlight: `M${(x - radiusX * 0.45).toFixed(1)} ${(y - radiusY * 0.35).toFixed(1)}l${(radiusX * 0.5).toFixed(1)} ${(-radiusY * 0.12).toFixed(1)}`,
      }
    })
    const specks = palette.specks.map((tone) => ({ tone, path: circlePath(base.x + (random() - 0.5) * spanX * 1.6, base.y + (random() - 0.5) * spanY * 1.6, 0.9 * perspective) }))
    return { specks, slabs }
  }
  const specks = palette.specks.map((tone) => ({
    tone,
    path: Array.from({ length: 2 }, () => circlePath(base.x + (random() - 0.5) * spanX * 2, base.y + (random() - 0.5) * spanY * 2, (0.7 + random() * 0.9) * perspective)).join(''),
  }))
  return { specks, slabs: [] }
}

export function mergeDetails(details: readonly CellDetail[]): CellDetail {
  const tones = new Map<string, string[]>()
  const slabs: CellDetail['slabs'] = []
  details.forEach((detail) => {
    detail.specks.forEach((speck) => tones.set(speck.tone, [...(tones.get(speck.tone) ?? []), speck.path]))
    slabs.push(...detail.slabs)
  })
  return { specks: [...tones.entries()].map(([tone, paths]) => ({ tone, path: paths.join('') })), slabs }
}

export function burstSpecks(cell: number, style: PathStyle, frame: PathFrame): { x: number; y: number; size: number; tone: string }[] {
  const random = createSeededRandom(cell * 31337 + 7)
  const palette = pathPalettes[style]
  const reach = Math.max(frame.size.x, frame.size.y)
  return Array.from({ length: 6 }, (_, index) => {
    const angle = (index / 6) * Math.PI * 2 + random() * 0.6
    const distance = reach * (0.45 + random() * 0.35)
    return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance * 0.55 - 3, size: 1 + random() * 1.4, tone: palette.specks[index % palette.specks.length] }
  })
}
