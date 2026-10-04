import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { findButterfly, nearestButterfly, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

export const butterflyBalletBehavior: Behavior = {
  id: 'butterflyBallet',
  intent: 'play',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, mind, context) => (nearestButterfly(cat, context, sizeScaled(context, 340)) ? 0.1 + mind.personality.curiosity * 0.15 : 0),
  start(cat, mind, context) {
    mind.butterflyId = nearestButterfly(cat, context, sizeScaled(context, 340))?.id ?? null
    mind.movePose = 'walk'
    mind.idlePose = 'reach'
    enterPhase(mind, 'follow', randomTimer(context, 0.6, 1.1))
    setEmote(cat, 'love')
  },
  update(cat, mind, context) {
    const butterfly = findButterfly(context, mind.butterflyId)
    if (!butterfly || mind.attempts >= 5) return finishBehavior(cat, mind, context)
    mind.scratchPoints.gaze = { x: butterfly.position.x, y: butterfly.position.y - butterfly.height }
    if (mind.phase === 'follow' && phaseDone(mind) && distance(cat.position, butterfly.position) < sizeScaled(context, 50)) {
      mind.attempts += 1
      const lift = Math.min(Math.max(butterfly.height - 10, 12), 30 + 34 * mind.personality.jumpPower)
      hopInPlace(cat, mind, context, lift, 0.34 + lift / 500, mind.attempts % 2 === 0 ? 'reach' : 'jump')
      enterPhase(mind, 'follow', randomTimer(context, 0.5, 1))
      return zeroVector
    }
    if (distance(cat.position, butterfly.position) < sizeScaled(context, 30)) return brake(cat)
    return arrive(cat, butterfly.position, paceSpeed(cat, mind, context, 0.45), 30)
  },
}
