import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import { BlobNotFoundError, BlobPreconditionFailedError } from '@vercel/blob'
import { parseParkName } from '../../shared/parkName.ts'
import { createBlobParkStore, parkBlobPathname, type BlobClient } from './blobParkStore.ts'
import { handleParkRequest } from './handleParkRequest.ts'
import { isParkKey, parkKeyOf } from './parkKey.ts'
import type { ParkStore } from './parkStoreTypes.ts'
import { createSqliteParkStore } from './sqliteParkStore.ts'
import { selectParkStore } from './selectParkStore.ts'

interface FakeBlob {
  body: string
  etag: string
}

interface RecordedCall {
  method: 'get' | 'put' | 'head'
  pathname: string
  options: Record<string, unknown>
}

const downloadSuffix = '?download=1'

function createFakeBlobClient() {
  const blobs = new Map<string, FakeBlob>()
  const cached = new Map<string, FakeBlob>()
  const calls: RecordedCall[] = []
  let serial = 0
  const client = {
    head: async (pathname: string, options: Record<string, unknown>) => {
      calls.push({ method: 'head', pathname, options })
      const blob = blobs.get(pathname)
      if (!blob) throw new BlobNotFoundError()
      return { pathname, etag: blob.etag, downloadUrl: `${pathname}${downloadSuffix}` }
    },
    get: async (target: string, options: Record<string, unknown>) => {
      calls.push({ method: 'get', pathname: target, options })
      const blob = cached.get(target) ?? blobs.get(target.replace(downloadSuffix, ''))
      if (!blob) return null
      return { statusCode: 200, stream: new Response(blob.body).body, headers: new Headers(), blob: { etag: `W/${blob.etag}`, pathname: target } }
    },
    put: async (pathname: string, body: string, options: Record<string, unknown>) => {
      calls.push({ method: 'put', pathname, options })
      const existing = blobs.get(pathname)
      if (typeof options.ifMatch === 'string' && existing?.etag !== options.ifMatch) throw new BlobPreconditionFailedError()
      if (existing && !options.allowOverwrite && options.ifMatch === undefined) throw new Error('Vercel Blob: This blob already exists')
      serial += 1
      blobs.set(pathname, { body, etag: `"etag-${serial}"` })
      return { pathname, etag: `"etag-${serial}"` }
    },
  }
  return { client: client as unknown as BlobClient, blobs, cached, calls }
}

function parkBody(updatedAt: number, first = 'Ada', last = 'Lovelace'): string {
  const economy = { wallet: 0, lifetimeEarned: 0, lifetimeSpent: 0, lifetimeRefunded: 0, holdings: [] }
  return JSON.stringify({ version: 3, updatedAt, owner: { first, last }, seed: 1, viewport: { width: 1, height: 1 }, sections: { economy } })
}

describe('park names and keys', () => {
  it('normalizes case and whitespace into one key', () => {
    const name = parseParkName('  Ada   LOVELACE ')
    assert.equal(name, 'ada lovelace')
    assert.equal(parkKeyOf(name ?? ''), parkKeyOf(parseParkName('ada lovelace') ?? 'x'))
    assert.ok(isParkKey(parkKeyOf('ada lovelace')))
  })

  it('rejects malformed names', () => {
    for (const raw of ['', 'ada', 'x1 y2', '../etc passwd', 'a'.repeat(90) + ' b', null]) assert.equal(parseParkName(raw), null)
    assert.equal(parseParkName("Zoë O'Brien-Smith"), "zoë o'brien-smith")
  })

  it('maps keys to a flat deterministic blob pathname', () => {
    const key = parkKeyOf('ada lovelace')
    assert.equal(parkBlobPathname(key), `parks/${key}.json`)
    assert.notEqual(parkKeyOf('ada lovelace'), parkKeyOf('ada lovelac'))
  })
})

describe('blob park store', () => {
  it('writes at the hashed pathname without random suffix and reads from origin', async () => {
    const { client, calls } = createFakeBlobClient()
    const store = createBlobParkStore({ token: 'fake', client })
    const key = parkKeyOf('ada lovelace')
    assert.equal(await store.read(key), null)
    assert.deepEqual(await store.write(key, { body: parkBody(10), updatedAt: 10 }), { status: 'saved', updatedAt: 10 })
    const put = calls.find((call) => call.method === 'put')
    assert.equal(put?.pathname, `parks/${key}.json`)
    assert.equal(put?.options.addRandomSuffix, false)
    assert.equal(put?.options.allowOverwrite, false)
    assert.equal(put?.options.access, 'public')
    assert.equal(put?.options.token, 'fake')
    assert.ok(calls.filter((call) => call.method === 'get').every((call) => call.options.useCache === false))
    assert.equal((await store.read(key))?.updatedAt, 10)
  })

  it('overwrites with the current etag and keeps the newest copy', async () => {
    const { client, calls } = createFakeBlobClient()
    const store = createBlobParkStore({ client })
    const key = parkKeyOf('ada lovelace')
    await store.write(key, { body: parkBody(10), updatedAt: 10 })
    assert.equal((await store.write(key, { body: parkBody(20), updatedAt: 20 })).status, 'saved')
    const overwrite = calls.filter((call) => call.method === 'put')[1]
    assert.equal(overwrite.options.ifMatch, '"etag-1"')
    assert.equal(overwrite.options.allowOverwrite, true)
    assert.deepEqual(await store.write(key, { body: parkBody(15), updatedAt: 15 }), { status: 'stale', updatedAt: 20 })
    assert.equal((await store.read(key))?.updatedAt, 20)
  })

  it('retries when another writer wins the race', async () => {
    const fake = createFakeBlobClient()
    const key = parkKeyOf('ada lovelace')
    let interfered = false
    const racingClient = {
      head: fake.client.head,
      get: fake.client.get,
      put: (async (pathname: string, body: string, options: Record<string, unknown>) => {
        if (!interfered) {
          interfered = true
          fake.blobs.set(pathname, { body: parkBody(12), etag: '"other"' })
        }
        return fake.client.put(pathname, body, options as never)
      }) as unknown as BlobClient['put'],
    }
    const store = createBlobParkStore({ client: racingClient })
    assert.equal((await store.write(key, { body: parkBody(30), updatedAt: 30 })).status, 'saved')
    assert.equal((await store.read(key))?.updatedAt, 30)
  })

  it('looks past a stale cached copy and overwrites with the live etag', async () => {
    const { client, blobs, cached } = createFakeBlobClient()
    const store = createBlobParkStore({ client })
    const key = parkKeyOf('ada lovelace')
    const pathname = parkBlobPathname(key)
    await store.write(key, { body: parkBody(10), updatedAt: 10 })
    cached.set(pathname, { ...(blobs.get(pathname) as FakeBlob) })
    await store.write(key, { body: parkBody(20), updatedAt: 20 })
    assert.equal((await store.read(key))?.updatedAt, 20)
    cached.set(`${pathname}${downloadSuffix}`, { ...(cached.get(pathname) as FakeBlob) })
    assert.equal((await store.write(key, { body: parkBody(30), updatedAt: 30 })).status, 'saved')
    cached.clear()
    assert.equal((await store.read(key))?.updatedAt, 30)
  })
})

describe('sqlite park store and request handler', () => {
  it('round-trips parks through the API surface', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'park-store-'))
    try {
      const store = createSqliteParkStore(join(directory, '.data', 'parks.sqlite'))
      const openStore = async (): Promise<ParkStore> => store
      const url = 'http://local/api/park?name=Ada%20Lovelace'
      assert.equal((await handleParkRequest(new Request(url), openStore)).status, 404)
      assert.equal((await handleParkRequest(new Request(url, { method: 'PUT', body: parkBody(5) }), openStore)).status, 200)
      assert.equal((await handleParkRequest(new Request(url, { method: 'POST', body: parkBody(4) }), openStore)).status, 409)
      const fetched = await handleParkRequest(new Request(url.replace('Ada%20Lovelace', '%20ada%20%20lovelace')), openStore)
      assert.equal(JSON.parse(await fetched.text()).updatedAt, 5)
      assert.equal((await handleParkRequest(new Request('http://local/api/park?name=x'), openStore)).status, 400)
      assert.equal((await handleParkRequest(new Request(url, { method: 'PUT', body: parkBody(9, 'Someone', 'Else') }), openStore)).status, 400)
      assert.equal((await handleParkRequest(new Request(url, { method: 'PUT', body: '{"nope":1}' }), openStore)).status, 400)
      assert.equal((await handleParkRequest(new Request(url, { method: 'PUT', body: 'x'.repeat(600_000) }), openStore)).status, 413)
      assert.equal((await handleParkRequest(new Request(url, { method: 'DELETE' }), openStore)).status, 405)
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  it('picks blob storage only when a token exists', async () => {
    assert.equal((await selectParkStore({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_fake' })).kind, 'blob')
    await assert.rejects(selectParkStore({ VERCEL: '1' }))
    const directory = mkdtempSync(join(tmpdir(), 'park-select-'))
    try {
      assert.equal((await selectParkStore({}, directory)).kind, 'sqlite')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
