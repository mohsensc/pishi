import { isRecord, readCount } from './fieldReaders'
import { LAST_LEGACY_SAVE_VERSION, type ParkSave } from './parkSaveTypes'

export function isLegacySave(save: ParkSave): boolean {
  return save.version <= LAST_LEGACY_SAVE_VERSION && !('economy' in save.sections)
}

export function legacyPointsOf(save: ParkSave): number {
  const world = save.sections.world
  if (!isRecord(world)) return 0
  const progress = isRecord(world.progress) ? readCount(world.progress.points) : undefined
  return progress ?? readCount(world.poppedCount) ?? 0
}
