import { displayNameOf, type ParkOwner } from '../../shared/parkName'
import { parseParkSave } from '../game/save/parseParkSave'
import type { ParkSave } from '../game/save/parkSaveTypes'

export type RemotePark = { status: 'found'; save: ParkSave } | { status: 'missing' } | { status: 'unavailable' }

export type RemoteWrite = 'saved' | 'stale' | 'rejected' | 'failed'

const parkEndpoint = '/api/park'
const keepaliveByteLimit = 60_000
const fetchTimeoutMs = 8000

function parkUrl(owner: ParkOwner): string {
  return `${parkEndpoint}?name=${encodeURIComponent(displayNameOf(owner))}`
}

export async function fetchRemotePark(owner: ParkOwner): Promise<RemotePark> {
  try {
    const response = await fetch(parkUrl(owner), { cache: 'no-store', signal: AbortSignal.timeout(fetchTimeoutMs) })
    if (response.status === 404) return { status: 'missing' }
    if (!response.ok) return { status: 'unavailable' }
    const save = parseParkSave(await response.json())
    return save ? { status: 'found', save } : { status: 'missing' }
  } catch {
    return { status: 'unavailable' }
  }
}

function beaconPark(owner: ParkOwner, serialized: string): RemoteWrite {
  if (typeof navigator.sendBeacon !== 'function') return 'failed'
  return navigator.sendBeacon(parkUrl(owner), new Blob([serialized], { type: 'application/json' })) ? 'saved' : 'failed'
}

export async function pushRemotePark(owner: ParkOwner, serialized: string, leaving = false): Promise<RemoteWrite> {
  const keepalive = leaving && new TextEncoder().encode(serialized).length < keepaliveByteLimit
  try {
    const response = await fetch(parkUrl(owner), {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: serialized,
      keepalive,
      signal: leaving ? undefined : AbortSignal.timeout(fetchTimeoutMs),
    })
    if (response.status === 409) return 'stale'
    if (response.status === 422) return 'rejected'
    return response.ok ? 'saved' : 'failed'
  } catch {
    return leaving ? beaconPark(owner, serialized) : 'failed'
  }
}
