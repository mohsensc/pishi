import { BlobNotFoundError, BlobPreconditionFailedError, get, head, put } from '@vercel/blob'
import { readUpdatedAt } from './parkBody.ts'
import type { ParkStore, ParkWriteResult, StoredPark } from './parkStoreTypes.ts'

type BlobGet = typeof get
type BlobPut = typeof put
type BlobHead = typeof head

export interface BlobClient {
  get: BlobGet
  put: BlobPut
  head: BlobHead
}

interface BlobParkStoreOptions {
  token?: string
  client?: BlobClient
  access?: 'public' | 'private'
}

interface CurrentBlob {
  park: StoredPark
  etag: string
}

interface BlobCopy {
  body: string
  etag: string
}

const parkFolder = 'parks'
const cacheSeconds = 60
const writeAttempts = 3

export function parkBlobPathname(key: string): string {
  return `${parkFolder}/${key}.json`
}

function strongEtagOf(etag: string): string {
  return etag.replace(/^W\//, '')
}

function isWriteConflict(error: unknown): boolean {
  if (error instanceof BlobPreconditionFailedError) return true
  return error instanceof Error && /already exists|precondition/i.test(error.message)
}

export function createBlobParkStore({ token, client = { get, put, head }, access = 'public' }: BlobParkStoreOptions = {}): ParkStore {
  const readMetadata = async (pathname: string) => {
    try {
      return await client.head(pathname, { token })
    } catch (error) {
      if (error instanceof BlobNotFoundError) return null
      throw error
    }
  }

  const readCopy = async (target: string): Promise<BlobCopy | null> => {
    const result = await client.get(target, { access, useCache: false, token })
    if (!result || result.statusCode !== 200) return null
    return { body: await new Response(result.stream).text(), etag: strongEtagOf(result.blob.etag) }
  }

  const readCurrent = async (pathname: string): Promise<CurrentBlob | null> => {
    const metadata = await readMetadata(pathname)
    if (!metadata) return null
    const etag = strongEtagOf(metadata.etag)
    let fallback: BlobCopy | null = null
    for (const target of [pathname, metadata.downloadUrl]) {
      const copy = await readCopy(target)
      if (copy?.etag === etag) return { park: { body: copy.body, updatedAt: readUpdatedAt(copy.body) }, etag }
      fallback ??= copy
    }
    return fallback ? { park: { body: fallback.body, updatedAt: readUpdatedAt(fallback.body) }, etag } : null
  }

  const write = async (key: string, park: StoredPark): Promise<ParkWriteResult> => {
    const pathname = parkBlobPathname(key)
    for (let attempt = 0; attempt < writeAttempts; attempt += 1) {
      const current = await readCurrent(pathname)
      if (current && current.park.updatedAt > park.updatedAt) return { status: 'stale', updatedAt: current.park.updatedAt }
      try {
        await client.put(pathname, park.body, {
          access,
          token,
          contentType: 'application/json',
          addRandomSuffix: false,
          cacheControlMaxAge: cacheSeconds,
          ...(current ? { ifMatch: current.etag, allowOverwrite: true } : { allowOverwrite: false }),
        })
        return { status: 'saved', updatedAt: park.updatedAt }
      } catch (error) {
        if (!isWriteConflict(error)) throw error
      }
    }
    throw new Error('park write kept conflicting')
  }

  return {
    kind: 'blob',
    read: async (key) => (await readCurrent(parkBlobPathname(key)))?.park ?? null,
    write,
  }
}
