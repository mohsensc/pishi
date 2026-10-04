import type { StepContext } from '../memory'
import { landscapeOf } from './landscapeState'
import { FELLED_MEMORY_SECONDS, STAMP_MEMORY_SECONDS } from './landscapeTypes'

export function stepLandscape(context: StepContext): void {
  const { world } = context
  const landscape = landscapeOf(world)
  if (landscape.felled.some((felled) => world.time - felled.time > FELLED_MEMORY_SECONDS || felled.time > world.time)) {
    landscape.felled = landscape.felled.filter((felled) => world.time - felled.time <= FELLED_MEMORY_SECONDS && felled.time <= world.time)
  }
  if (landscape.stamps.some((stamp) => world.time - stamp.time > STAMP_MEMORY_SECONDS || stamp.time > world.time)) {
    landscape.stamps = landscape.stamps.filter((stamp) => world.time - stamp.time <= STAMP_MEMORY_SECONDS && stamp.time <= world.time)
  }
}
