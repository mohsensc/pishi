import type { Behavior } from '../behavior'
import { parkNovelty } from '../helpers/propUse'
import { batPinwheelBehavior } from './batPinwheel'
import { batSpringToyBehavior } from './batSpringToy'
import { chaseBubblesBehavior } from './chaseBubbles'
import { drinkAtFountainBehavior } from './drinkAtFountain'
import { fountainRimPerchBehavior } from './fountainRimPerch'
import { sprinklerPounceBehavior } from './sprinklerPounce'
import { swingRideBehavior } from './swingRide'
import { watchFeederBirdsBehavior } from './watchFeederBirds'
import { windmillWatchBehavior } from './windmillWatch'

const shopItemAppeal = 7

function withShopAppeal(behavior: Behavior): Behavior {
  return {
    ...behavior,
    weight(cat, mind, context) {
      const base = behavior.weight(cat, mind, context)
      return base > 0 ? base * shopItemAppeal * parkNovelty(behavior.id, context) : 0
    },
  }
}

export const shopItemCalmBehaviorIds = ['fountainRimPerch', 'swingRide', 'windmillWatch']

export const shopItemBehaviors: Behavior[] = [
  drinkAtFountainBehavior,
  fountainRimPerchBehavior,
  swingRideBehavior,
  batSpringToyBehavior,
  batPinwheelBehavior,
  windmillWatchBehavior,
  watchFeederBirdsBehavior,
  chaseBubblesBehavior,
  sprinklerPounceBehavior,
].map(withShopAppeal)
