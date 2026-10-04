import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ParkOwner } from '../../shared/parkName'
import type { ParkIdentity, ParkSave } from '../game/save/parkSaveTypes'
import type { WorldSource } from '../hooks/useWorld'
import { readRememberedOwner, rememberOwner } from './parkCache'
import { loadParkSession, prefetchRemotePark, sessionFromRemote, type ParkSession } from './parkLoader'
import { createParkWorldSource } from './parkWorldSource'

interface ActiveSession {
  session: ParkSession
  generation: number
}

interface ParkSessionHandle {
  rememberedOwner: ParkOwner | null
  busy: boolean
  enter: (owner: ParkOwner) => void
  worldSource: WorldSource | null
  generation: number
}

export function useParkSession(): ParkSessionHandle {
  const [rememberedOwner] = useState(readRememberedOwner)
  const [active, setActive] = useState<ActiveSession | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (rememberedOwner) prefetchRemotePark(rememberedOwner)
  }, [rememberedOwner])

  const enter = useCallback((owner: ParkOwner) => {
    setBusy(true)
    rememberOwner(owner)
    loadParkSession(owner)
      .then((session) => setActive((current) => ({ session, generation: (current?.generation ?? 0) + 1 })))
      .finally(() => setBusy(false))
  }, [])

  const adoptNewerRemote = useCallback((identity: ParkIdentity, save: ParkSave) => {
    setActive((current) => (current ? { session: sessionFromRemote(identity, save), generation: current.generation + 1 } : current))
  }, [])

  const worldSource = useMemo(
    () => (active ? createParkWorldSource(active.session, (save) => adoptNewerRemote(active.session.identity, save)) : null),
    [active, adoptNewerRemote],
  )

  return { rememberedOwner, busy, enter, worldSource, generation: active?.generation ?? 0 }
}
