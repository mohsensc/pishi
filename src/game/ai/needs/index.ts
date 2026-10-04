import type { Behavior } from '../behavior'
import { groggyWakeBehavior } from './groggyWake'
import { needSleepBehavior } from './needSleep'

export const needBehaviors: Behavior[] = [needSleepBehavior, groggyWakeBehavior]
