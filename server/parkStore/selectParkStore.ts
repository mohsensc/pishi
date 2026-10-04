import { resolve } from 'node:path'
import { createBlobParkStore } from './blobParkStore.ts'
import type { ParkStore } from './parkStoreTypes.ts'

interface ParkStoreEnvironment {
  BLOB_READ_WRITE_TOKEN?: string
  VERCEL?: string
}

export function databasePathFor(root: string): string {
  return resolve(root, '.data', 'parks.sqlite')
}

export async function selectParkStore(environment: ParkStoreEnvironment = process.env, root = process.cwd()): Promise<ParkStore> {
  const token = environment.BLOB_READ_WRITE_TOKEN?.trim()
  if (token) return createBlobParkStore({ token })
  if (environment.VERCEL) throw new Error('blob storage is not connected to this deployment')
  const { createSqliteParkStore } = await import('./sqliteParkStore.ts')
  return createSqliteParkStore(databasePathFor(root))
}
