import { captureFields, isRecord, readCount, readIntegerIn, readNumberIn, restoreFields, type FieldReader, type FieldReaders } from '../fieldReaders'
import type { ParkSection } from '../parkSaveTypes'
import type { ProgressState, World } from '../../types'
import { createProgressState } from '../../progress/progress'
import { COLLAR_CAPACITY } from '../../progress/progressCatalog'

export const progressFields: FieldReaders<ProgressState> = {
  collars: readIntegerIn(0, COLLAR_CAPACITY),
}

const readProgress: FieldReader<ProgressState> = (raw) => (isRecord(raw) ? restoreFields(createProgressState(), raw, progressFields) : undefined)

export const worldFields: FieldReaders<World> = {
  poppedCount: readCount,
  dayTime: readNumberIn(0, 0.9999),
  progress: readProgress,
}

export const worldSection: ParkSection = {
  key: 'world',
  capture: (world) => ({ ...captureFields(world, worldFields), progress: captureFields(world.progress, progressFields) }),
  restore: (raw, { world }) => {
    restoreFields(world, raw, worldFields)
  },
}
