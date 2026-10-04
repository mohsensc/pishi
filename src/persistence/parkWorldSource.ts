import { createParkWorld } from '../game/save/restoreParkWorld'
import type { ParkSave } from '../game/save/parkSaveTypes'
import type { WorldSource } from '../hooks/useWorld'
import { startParkAutosave } from './parkAutosave'
import type { ParkSession } from './parkLoader'

export function createParkWorldSource(session: ParkSession, onNewerRemote: (save: ParkSave) => void): WorldSource {
  return {
    createWorld: (viewport) => createParkWorld(viewport, session.identity, session.save),
    attach: (readLiveWorld) => startParkAutosave({ session, readLiveWorld, onNewerRemote }),
  }
}
