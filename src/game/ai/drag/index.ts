import type { Behavior } from '../behavior'
import { handledLandingBehavior } from './handledLanding'
import { investigateDropBehavior } from './investigateDrop'
import { watchCarriedBehavior } from './watchCarried'
import { watchThrowBehavior } from './watchThrow'

export const dragBehaviors: Behavior[] = [handledLandingBehavior, watchCarriedBehavior, investigateDropBehavior, watchThrowBehavior]
