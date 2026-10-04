import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { raiseAffection } from './support/affection'
import { cursorOnBody, pointerSpeed } from './support/cursorGround'
import { every, gazeAt } from './support/phases'
import { activeHeldToy } from './support/toolQueries'

export const getBrushedBehavior: Behavior = {
  id: 'getBrushed',
  intent: 'socialize',
  interruptible: false,
  ownsTimer: true,
  minDuration: 6,
  maxDuration: 12,
  weight: () => 0,
  start(cat, mind) {
    mind.idlePose = 'purr'
    setEmote(cat, 'love')
    setAction(cat, 'purr')
  },
  update(cat, mind, context) {
    const brush = activeHeldToy(context, 'brush')
    const touching = brush !== null && cursorOnBody(cat, context, 48)
    mind.scratchNumbers.away = touching ? 0 : (mind.scratchNumbers.away ?? 0) + context.dt
    if (!brush || mind.scratchNumbers.away > 1 || mind.behaviorElapsed > 20) {
      lockPose(mind, 'stretch', 0.8)
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, context.pointer.position, 0.3)
    const speed = pointerSpeed(context)
    const stroking = touching && speed > 30 && speed < 1400
    mind.scratchNumbers.idle = stroking ? 0 : (mind.scratchNumbers.idle ?? 0) + context.dt
    if (stroking) {
      mind.idlePose = 'purr'
      raiseAffection(cat, 0.05 * context.dt)
      if (every(mind, context, 'tuft', 0.45)) spawnEffect(context.world, 'furTuft', cat.position, cat.height + 20 * cat.coat.scale, null, 0.6)
      if (every(mind, context, 'purr', 1.3)) setAction(cat, 'purr')
    }
    if (mind.scratchNumbers.idle > 1.2) {
      mind.scratchNumbers.idle = 0
      mind.idlePose = 'sniff'
      cat.velocity = { x: (context.pointer.position.x > cat.position.x ? 1 : -1) * 50, y: 0 }
      setEmote(cat, 'love')
    }
    return brake(cat, 2)
  },
}
