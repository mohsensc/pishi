import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import type { ParkStore } from './parkStoreTypes.ts'

interface ParkRow {
  body: string
  updated_at: number
}

export function createSqliteParkStore(databasePath: string): ParkStore {
  mkdirSync(dirname(databasePath), { recursive: true })
  const database = new DatabaseSync(databasePath)
  database.exec('pragma journal_mode = wal')
  database.exec('create table if not exists parks (key text primary key, body text not null, updated_at integer not null)')
  const selectPark = database.prepare('select body, updated_at from parks where key = ?')
  const upsertPark = database.prepare(
    'insert into parks (key, body, updated_at) values (?, ?, ?) on conflict(key) do update set body = excluded.body, updated_at = excluded.updated_at where excluded.updated_at >= parks.updated_at',
  )
  const readRow = (key: string): ParkRow | undefined => selectPark.get(key) as ParkRow | undefined

  return {
    kind: 'sqlite',
    read: async (key) => {
      const row = readRow(key)
      return row ? { body: row.body, updatedAt: Number(row.updated_at) } : null
    },
    write: async (key, park) => {
      const result = upsertPark.run(key, park.body, Math.round(park.updatedAt))
      if (Number(result.changes) > 0) return { status: 'saved', updatedAt: park.updatedAt }
      return { status: 'stale', updatedAt: Number(readRow(key)?.updated_at ?? 0) }
    },
  }
}
