import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { laserDot } from './support/laser'
import { chain, enterPhase, gazeAt, phaseDone } from './support/phases'

export const pounceLaserBehavior: Behavior = {
  id: 'pounceLaser',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 2,
  maxDuration: 3,
  weight: () => 0,
  start(_cat, mind, context) {
    mind.idlePose = 'stalk'
    enterPhase(mind, 'wiggle', context.memory.random.range(0.2, 0.45))
  },
  update(cat, mind, context) {
    const dot = laserDot(context)
    if (mind.phase === 'wiggle') {
      if (!dot) {
        chain(cat, mind, context, 'searchForLaser', 2.4)
        return zeroVector
      }
      gazeAt(cat, mind, dot, 0.3)
      if (!phaseDone(mind)) return brake(cat, 8)
      const hop = distance(cat.position, dot)
      startLeap(cat, mind, context, dot, 0, (24 + 18 * mind.personality.jumpPower) * cat.coat.scale, 0.3 + Math.min(0.2, hop / 900), 'pounce', 'none')
      mind.scratchPoints.aim = { x: dot.x, y: dot.y }
      enterPhase(mind, 'landed', 0.8)
      return zeroVector
    }
    if (mind.phase === 'landed') {
      const aim = mind.scratchPoints.aim
      const pinned = dot && aim && distance(dot, cat.position) < 18 * cat.coat.scale
      mind.idlePose = pinned ? 'peek' : 'crouch'
      if (mind.phaseTimer < 0.05 && pinned) setEmote(cat, 'curious')
      if (dot) gazeAt(cat, mind, dot, 0.2)
      if (!phaseDone(mind)) return brake(cat, 8)
      if (!dot) chain(cat, mind, context, 'searchForLaser', 2.4)
      else if (context.memory.random.chance(0.2)) chain(cat, mind, context, 'laserZoomies', 3.5)
      else chain(cat, mind, context, 'chaseLaser', 3.4)
      return zeroVector
    }
    return brake(cat)
  },
}
