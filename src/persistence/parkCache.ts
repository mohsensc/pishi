import { isValidOwner, parkNameOf, tidyOwner, type ParkOwner } from '../../shared/parkName'
import { parseParkSaveText } from '../game/save/parseParkSave'
import type { ParkSave } from '../game/save/parkSaveTypes'

const ownerStorageKey = 'catPark.owner'
const parkStoragePrefix = 'catPark.park.'

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function readRememberedOwner(): ParkOwner | null {
  try {
    const parsed: unknown = JSON.parse(readStorage(ownerStorageKey) ?? 'null')
    if (typeof parsed !== 'object' || parsed === null) return null
    const { first, last } = parsed as Record<string, unknown>
    if (typeof first !== 'string' || typeof last !== 'string') return null
    return isValidOwner({ first, last }) ? tidyOwner({ first, last }) : null
  } catch {
    return null
  }
}

export function rememberOwner(owner: ParkOwner): void {
  writeStorage(ownerStorageKey, JSON.stringify(tidyOwner(owner)))
}

export function readCachedPark(owner: ParkOwner): ParkSave | null {
  const save = parseParkSaveText(readStorage(`${parkStoragePrefix}${parkNameOf(owner)}`))
  return save && parkNameOf(save.owner) === parkNameOf(owner) ? save : null
}

export function writeCachedPark(owner: ParkOwner, serialized: string): boolean {
  return writeStorage(`${parkStoragePrefix}${parkNameOf(owner)}`, serialized)
}
