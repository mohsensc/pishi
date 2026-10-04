import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { setAction, setEmote } from '../helpers/pose'
import { brake } from '../helpers/steering'
import { every } from './support/phases'
import { findPatch } from './support/catnip'

export const catnipRollBehavior: Behavior = {
  id: 'catnipRoll',
  intent: 'play',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'bellyUp'
    setAction(cat, 'catnipHigh')
    setEmote(cat, 'love')
  },
  update(cat, mind, context) {
    if (every(mind, context, 'roll', 0.8)) {
      mind.idlePose = mind.idlePose === 'bellyUp' ? 'wrestle' : 'bellyUp'
      cat.velocity = { x: context.memory.random.range(-40, 40), y: 0 }
    }
    const patch = findPatch(context, mind.scratchIds.patch)
    if (patch && every(mind, context, 'puff', 1.1)) spawnEffect(context.world, 'catnipPuff', cat.position, 8, null, 0.4 * patch.potency + 0.2)
    if (every(mind, context, 'high', 1.5)) setAction(cat, 'catnipHigh')
    return brake(cat, 2)
  },
}
