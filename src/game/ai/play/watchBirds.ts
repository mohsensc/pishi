import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { isOpenGround, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'

export const watchBirdsBehavior: Behavior = {
  id: 'watchBirds',
  intent: 'explore',
  interruptible: true,
  minDuration: 4,
  maxDuration: 7,
  weight: (_cat, mind) => 0.05 + mind.personality.curiosity * 0.1,
  start(cat, mind, context) {
    const bounds = context.bounds
    const spot = { x: Math.min(Math.max(cat.position.x + context.memory.random.range(-120, 120), bounds.left), bounds.right), y: bounds.top + sizeScaled(context, 8) }
    mind.target = isOpenGround(spot, context, 20) ? spot : { x: cat.position.x, y: bounds.top + sizeScaled(context, 30) }
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    if (mind.phase === 'watch') {
      const sweep = Math.sin(cat.clock * 0.8) * 160
      mind.scratchPoints.gaze = { x: cat.position.x + sweep, y: context.bounds.top - 110 + Math.sin(cat.clock * 2.3) * 20 }
      mind.idlePose = Math.sin(cat.clock * 1.3) > 0.75 ? 'crouch' : 'sit'
      if (cat.emote === null && context.memory.random.chance(context.dt * 0.3)) setEmote(cat, 'curious')
      if (phaseDone(mind)) return finishBehavior(cat, mind, context)
      return brake(cat)
    }
    if (!mind.target || distance(cat.position, mind.target) < sizeScaled(context, 12) || mind.phaseTimer > 5) {
      setEmote(cat, 'curious')
      enterPhase(mind, 'watch', randomTimer(context, 4, 7))
      return zeroVector
    }
    return arrive(cat, mind.target, paceSpeed(cat, mind, context, 0.34), 24)
  },
}
