export interface StoredPark {
  body: string
  updatedAt: number
}

export type ParkWriteResult = { status: 'saved'; updatedAt: number } | { status: 'stale'; updatedAt: number }

export interface ParkStore {
  kind: 'blob' | 'sqlite'
  read: (key: string) => Promise<StoredPark | null>
  write: (key: string, park: StoredPark) => Promise<ParkWriteResult>
}
