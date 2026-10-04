import type { Behavior } from '../behavior'
import { hopScotchBehavior } from './hopScotch'
import { parkourChainBehavior } from './parkourChain'
import { propVaultBehavior } from './propVault'
import { sprintBurstBehavior } from './sprintBurst'

export const motionBehaviors: Behavior[] = [parkourChainBehavior, sprintBurstBehavior, propVaultBehavior, hopScotchBehavior]
