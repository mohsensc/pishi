import type { Behavior } from '../behavior'
import { boundsCenter } from '../../bounds'
import { add, normalize, scale, subtract } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

export const sniffTrailBehavior: Behavior = {
  id: 'sniffTrail',
  intent: 'explore',
  interruptible: true,
  minDuration: 7,
  maxDuration: 12,
  weight: (_cat, mind) => 0.06 + mind.personality.curiosity * 0.16,
  start(cat, mind, context) {
    mind.scratchNumbers.angle = context.memory.random.range(0, Math.PI * 2)
    mind.scratchNumbers.stops = 0
    mind.movePose = 'sniff'
    mind.idlePose = 'sniff'
    enterPhase(mind, 'trail', randomTimer(context, 1.6, 2.6))
    if (cat.emote === null) setEmote(cat, 'curious')
  },
  update(cat, mind, context) {
    if (mind.phase === 'pause') {
      if (phaseDone(mind)) enterPhase(mind, 'trail', randomTimer(context, 1.6, 2.6))
      return brake(cat)
    }
    if (phaseDone(mind)) {
      mind.scratchNumbers.stops += 1
      if (mind.scratchNumbers.stops > 4) return finishBehavior(cat, mind, context)
      enterPhase(mind, 'pause', randomTimer(context, 0.5, 1.1))
      return zeroVector
    }
    const turn = Math.sin(cat.clock * 2.3) * 1.8 + Math.sin(cat.clock * 0.9 + 1) * 0.9
    mind.scratchNumbers.angle += turn * context.dt
    const angle = mind.scratchNumbers.angle
    const heading = { x: Math.cos(angle), y: Math.sin(angle) * 0.7 }
    const toCenter = normalize(subtract(boundsCenter(context.bounds), cat.position))
    const bounds = context.bounds
    const edge = Math.min(cat.position.x - bounds.left, bounds.right - cat.position.x, cat.position.y - bounds.top, bounds.bottom - cat.position.y)
    const pull = edge < 60 ? 1.4 : 0
    return scale(normalize(add(heading, scale(toCenter, pull))), paceSpeed(cat, mind, context, 0.15))
  },
}
