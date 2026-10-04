import type { StepContext } from '../memory'
import { stepBirdVisits } from './birdVisits'
import { stepButterflyHouses } from './butterflyHouse'
import { stepNightGlow } from './nightGlow'
import { watchPlacedProps } from './placedPropWatch'
import { stirSpinners } from './spinnerStir'
import { stepSprinklers } from './sprinklerSpray'

export function stepShopItems(context: StepContext): void {
  watchPlacedProps(context)
  stirSpinners(context)
  stepBirdVisits(context)
  stepButterflyHouses(context)
  stepSprinklers(context)
  stepNightGlow(context)
}
