import { isValidOwner, tidyOwner, type ParkOwner } from '../../../shared/parkName'
import { REFERENCE_HEIGHT, REFERENCE_WIDTH } from '../constants'
import { isRecord, readIntegerIn, readNumberIn } from './fieldReaders'
import type { ParkSave, SavedViewport } from './parkSaveTypes'
import { parkSeedOf } from './parkSeed'

const readVersion = readIntegerIn(1, 1_000_000)
const readUpdatedAt = readNumberIn(1, Number.MAX_SAFE_INTEGER)
const readSeed = readIntegerIn(0, 0xffffffff)
const readSide = readNumberIn(1, 20_000)

function readOwner(raw: unknown): ParkOwner | null {
  if (!isRecord(raw) || typeof raw.first !== 'string' || typeof raw.last !== 'string') return null
  const owner = { first: raw.first, last: raw.last }
  return isValidOwner(owner) ? tidyOwner(owner) : null
}

function readViewport(raw: unknown): SavedViewport {
  const width = isRecord(raw) ? readSide(raw.width) : undefined
  const height = isRecord(raw) ? readSide(raw.height) : undefined
  return width && height ? { width, height } : { width: REFERENCE_WIDTH, height: REFERENCE_HEIGHT }
}

export function parseParkSave(raw: unknown): ParkSave | null {
  if (!isRecord(raw)) return null
  const version = readVersion(raw.version)
  const updatedAt = readUpdatedAt(raw.updatedAt)
  const owner = readOwner(raw.owner)
  if (!version || !updatedAt || !owner) return null
  return {
    version,
    updatedAt,
    owner,
    seed: readSeed(raw.seed) ?? parkSeedOf(owner),
    viewport: readViewport(raw.viewport),
    sections: isRecord(raw.sections) ? raw.sections : {},
  }
}

export function parseParkSaveText(text: string | null): ParkSave | null {
  if (!text) return null
  try {
    return parseParkSave(JSON.parse(text))
  } catch {
    return null
  }
}
