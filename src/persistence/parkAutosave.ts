import { captureParkSave, parkFingerprint, serializeParkSave } from '../game/save/captureParkSave'
import type { ParkSave } from '../game/save/parkSaveTypes'
import type { World } from '../game/types'
import { fetchRemotePark, pushRemotePark, type RemotePark } from './parkApi'
import { writeCachedPark } from './parkCache'
import type { ParkSession } from './parkLoader'

interface ParkAutosaveOptions {
  session: ParkSession
  readLiveWorld: () => World
  onNewerRemote: (save: ParkSave) => void
}

interface ParkSnapshot {
  save: ParkSave
  fingerprint: string
}

export const LOCAL_SAVE_INTERVAL_MS = 4000
export const REMOTE_SAVE_INTERVAL_MS = 90_000
const remoteRetryMs = 30_000
const hiddenPushGapMs = 20_000
const rejectedBackoffMs = 120_000

export function startParkAutosave({ session, readLiveWorld, onNewerRemote }: ParkAutosaveOptions): () => void {
  const { identity } = session
  let stopped = false
  let remoteReady = false
  let remoteRetryAt: number | null = null
  let remotePushing = false
  let lastRemoteAttempt = 0
  let localFingerprint = ''
  let remoteFingerprint = ''
  let newestOwnUpdate = session.save?.updatedAt ?? 0

  const snapshot = (): ParkSnapshot => {
    const save = captureParkSave(readLiveWorld(), identity, Math.max(Date.now(), newestOwnUpdate + 1))
    return { save, fingerprint: parkFingerprint(save) }
  }

  const saveLocally = ({ save, fingerprint }: ParkSnapshot) => {
    if (fingerprint === localFingerprint) return
    if (writeCachedPark(identity.owner, serializeParkSave(save))) localFingerprint = fingerprint
  }

  const handleRemote = (remote: RemotePark) => {
    if (stopped) return
    if (remote.status === 'unavailable') {
      remoteReady = false
      remoteRetryAt = Date.now() + remoteRetryMs
      return
    }
    if (remote.status === 'found' && remote.save.updatedAt > newestOwnUpdate) {
      stopped = true
      onNewerRemote(remote.save)
      return
    }
    remoteReady = true
    lastRemoteAttempt = remote.status === 'found' ? Date.now() : 0
  }

  const adoptAuthoritative = (remote: RemotePark) => {
    if (stopped || remote.status !== 'found') return
    stopped = true
    onNewerRemote(remote.save)
  }

  const recheckRemote = () => {
    fetchRemotePark(identity.owner).then(handleRemote)
  }

  const pushRemotely = async (current: ParkSnapshot, leaving: boolean) => {
    if (!remoteReady || current.fingerprint === remoteFingerprint || (remotePushing && !leaving)) return
    lastRemoteAttempt = Date.now()
    if (leaving) remoteFingerprint = current.fingerprint
    else remotePushing = true
    const outcome = await pushRemotePark(identity.owner, serializeParkSave(current.save), leaving)
    if (!leaving) remotePushing = false
    if (outcome === 'saved') {
      remoteFingerprint = current.fingerprint
      newestOwnUpdate = Math.max(newestOwnUpdate, current.save.updatedAt)
    }
    if (outcome === 'rejected') {
      remoteFingerprint = current.fingerprint
      lastRemoteAttempt = Date.now() + rejectedBackoffMs
      if (!stopped) fetchRemotePark(identity.owner).then(adoptAuthoritative)
    }
    if (outcome === 'stale' && !stopped) recheckRemote()
  }

  const tick = () => {
    if (stopped) return
    const current = snapshot()
    saveLocally(current)
    const now = Date.now()
    if (!remoteReady) {
      if (remoteRetryAt !== null && now >= remoteRetryAt) {
        remoteRetryAt = null
        recheckRemote()
      }
      return
    }
    if (now - lastRemoteAttempt >= REMOTE_SAVE_INTERVAL_MS) void pushRemotely(current, false)
  }

  const flush = (force: boolean) => {
    if (stopped) return
    const current = snapshot()
    saveLocally(current)
    if (force || Date.now() - lastRemoteAttempt >= hiddenPushGapMs) void pushRemotely(current, true)
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') flush(false)
  }
  const handlePageHide = () => flush(true)

  session.remote.then((remote) => {
    handleRemote(remote)
    if (remoteReady && remote.status === 'missing') tick()
  })
  const interval = window.setInterval(tick, LOCAL_SAVE_INTERVAL_MS)
  document.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('pagehide', handlePageHide)

  return () => {
    stopped = true
    window.clearInterval(interval)
    document.removeEventListener('visibilitychange', handleVisibility)
    window.removeEventListener('pagehide', handlePageHide)
  }
}
