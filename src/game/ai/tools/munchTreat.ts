import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { coolDownTools } from '../../tools/toolState'
import { setAction, setEmote } from '../helpers/pose'
import { mouthPoint } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { feed, raiseAffection } from './support/affection'
import { every } from './support/phases'

export const munchTreatBehavior: Behavior = {
  id: 'munchTreat',
  intent: 'play',
  interruptible: false,
  minDuration: 1.8,
  maxDuration: 2.6,
  weight: () => 0,
  start(cat, mind, context) {
    mind.idlePose = 'eat'
    setAction(cat, 'munch')
    setEmote(cat, 'proud')
    feed(cat, 0.06)
    raiseAffection(cat, 0.03)
    coolDownTools(context.world, cat.id, 2.5)
  },
  update(cat, mind, context) {
    mind.idlePose = cat.intentTimer < 0.6 ? 'groom' : 'eat'
    if (every(mind, context, 'crumbs', 0.45)) spawnEffect(context.world, 'crumbs', mouthPoint(cat), 4, null, 0.4)
    return brake(cat)
  },
}
