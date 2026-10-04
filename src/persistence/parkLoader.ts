import { parkNameOf, tidyOwner, type ParkOwner } from '../../shared/parkName'
import type { ParkIdentity, ParkSave } from '../game/save/parkSaveTypes'
import { parkSeedOf } from '../game/save/parkSeed'
import { fetchRemotePark, type RemotePark } from './parkApi'
import { readCachedPark } from './parkCache'

export interface ParkSession {
  identity: ParkIdentity
  save: ParkSave | null
  remote: Promise<RemotePark>
}

interface RemoteRequest {
  promise: Promise<RemotePark>
  result: RemotePark | null
}

const remoteRequests = new Map<string, RemoteRequest>()

function requestRemote(owner: ParkOwner): RemoteRequest {
  const key = parkNameOf(owner)
  const existing = remoteRequests.get(key)
  if (existing) return existing
  const request: RemoteRequest = { promise: fetchRemotePark(owner), result: null }
  request.promise.then((result) => {
    request.result = result
  })
  remoteRequests.set(key, request)
  return request
}

function takeRemote(owner: ParkOwner): RemoteRequest {
  const request = requestRemote(owner)
  remoteRequests.delete(parkNameOf(owner))
  return request
}

export function prefetchRemotePark(owner: ParkOwner): void {
  requestRemote(owner)
}

function newestOf(cached: ParkSave, remote: RemotePark | null): ParkSave {
  return remote?.status === 'found' && remote.save.updatedAt > cached.updatedAt ? remote.save : cached
}

export async function loadParkSession(rawOwner: ParkOwner): Promise<ParkSession> {
  const owner = tidyOwner(rawOwner)
  const identity: ParkIdentity = { owner, seed: parkSeedOf(owner) }
  const cached = readCachedPark(owner)
  const request = takeRemote(owner)
  if (cached) return { identity, save: newestOf(cached, request.result), remote: request.promise }
  const remote = await request.promise
  return { identity, save: remote.status === 'found' ? remote.save : null, remote: Promise.resolve(remote) }
}

export function sessionFromRemote(identity: ParkIdentity, save: ParkSave): ParkSession {
  return { identity, save, remote: Promise.resolve({ status: 'found', save }) }
}
