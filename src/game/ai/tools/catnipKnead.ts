import type { Behavior } from '../behavior'
import { setAction, setEmote } from '../helpers/pose'
import { brake } from '../helpers/steering'
import { every } from './support/phases'

export const catnipKneadBehavior: Behavior = {
  id: 'catnipKnead',
  intent: 'play',
  interruptible: true,
  minDuration: 3,
  maxDuration: 6,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'knead'
    setEmote(cat, 'love')
    setAction(cat, 'purr')
  },
  update(cat, mind, context) {
    if (every(mind, context, 'purr', 1.5)) setAction(cat, 'purr')
    if (every(mind, context, 'love', 2.4)) setEmote(cat, 'love')
    return brake(cat)
  },
}
