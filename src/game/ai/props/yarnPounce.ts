import type { Behavior } from '../behavior'
import { releaseProp } from '../helpers/propUse'
import { chaseYarn } from './yarnPlay'

export const yarnPounceBehavior: Behavior = {
  id: 'yarnPounce',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 9,
  weight: () => 0,
  start(_cat, mind) {
    mind.speedBoost = 1.1
  },
  update: (cat, mind, context) => chaseYarn(cat, mind, context),
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
