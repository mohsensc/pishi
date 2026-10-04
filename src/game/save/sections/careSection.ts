import { careItemKinds, CARE_TRAY_CAPACITY } from '../../care/careCatalog'
import { createCareState } from '../../care/inventory'
import type { CareItem, CareState } from '../../care/careTypes'
import { captureFields, highestSerial, isRecord, readCount, readId, readList, readNumberIn, readOneOf, restoreFields, type FieldReaders } from '../fieldReaders'
import type { ParkSection } from '../parkSaveTypes'

const restoredItemAge = 60
const readCareKind = readOneOf(careItemKinds)

export const careFields: FieldReaders<CareState> = {
  meter: readNumberIn(0, 2),
  serial: readCount,
}

function restoreInventory(raw: unknown, unlockedAt: number): CareItem[] {
  const usedIds = new Set<string>()
  return readList(raw, CARE_TRAY_CAPACITY).flatMap((entry) => {
    if (!isRecord(entry)) return []
    const id = readId(entry.id)
    const kind = readCareKind(entry.kind)
    if (!id || !kind || usedIds.has(id)) return []
    usedIds.add(id)
    return [{ id, kind, unlockedAt }]
  })
}

export const careSection: ParkSection = {
  key: 'care',
  capture: (world) => ({
    ...captureFields(world.care, careFields),
    inventory: world.care.inventory.map(({ id, kind }) => ({ id, kind })),
  }),
  restore: (raw, { world }) => {
    const care = restoreFields(createCareState(), raw, careFields)
    const inventory = restoreInventory(isRecord(raw) ? raw.inventory : null, world.time - restoredItemAge)
    const serial = Math.max(care.serial, highestSerial(inventory.map((item) => item.id), /^care-(\d+)$/))
    world.care = { ...care, inventory, serial, lastReward: null }
  },
}
