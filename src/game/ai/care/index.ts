import type { Behavior } from '../behavior'
import { approachOfferBehavior } from './approachOffer'
import { enjoyCareItemBehavior } from './enjoyCareItem'

export const careBehaviors: Behavior[] = [enjoyCareItemBehavior, approachOfferBehavior]
