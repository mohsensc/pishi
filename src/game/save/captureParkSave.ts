import type { World } from '../types'
import { parkSections } from './parkSections'
import { PARK_SAVE_VERSION, type ParkIdentity, type ParkSave } from './parkSaveTypes'

const numberPrecision = 1000

function roundNumbers(_key: string, value: unknown): unknown {
  return typeof value === 'number' && !Number.isInteger(value) ? Math.round(value * numberPrecision) / numberPrecision : value
}

export function captureParkSave(world: World, identity: ParkIdentity, updatedAt = Date.now()): ParkSave {
  return {
    version: PARK_SAVE_VERSION,
    updatedAt,
    owner: { ...identity.owner },
    seed: identity.seed,
    viewport: { width: world.width, height: world.height },
    sections: Object.fromEntries(parkSections.map((section) => [section.key, section.capture(world)])),
  }
}

export function serializeParkSave(save: ParkSave): string {
  return JSON.stringify(save, roundNumbers)
}

export function parkFingerprint(save: ParkSave): string {
  return JSON.stringify({ viewport: save.viewport, sections: save.sections }, roundNumbers)
}
