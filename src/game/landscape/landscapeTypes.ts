export type PathStyle = 'gravel' | 'stone'

export interface FelledTree {
  id: string
  propId: string
  position: { x: number; y: number }
  radius: number
  variant: number
  direction: 1 | -1
  scale: number
  time: number
}

export interface PathStamp {
  id: string
  cells: readonly number[]
  style: PathStyle | null
  erasedStyles: readonly PathStyle[]
  time: number
}

export interface LandscapeState {
  pathCells: readonly number[]
  felled: FelledTree[]
  stamps: PathStamp[]
  serial: number
}

export const FELLED_MEMORY_SECONDS = 8
export const STAMP_MEMORY_SECONDS = 3
