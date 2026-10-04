import type { Behavior } from '../behavior'
import { enterPhase, finishBehavior, isNight, phaseDone, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake, orbit } from '../helpers/steering'

export const circleSettleBehavior: Behavior = {
  id: 'circleSettle',
  intent: 'napping',
  interruptible: true,
  minDuration: 5,
  maxDuration: 8,
  weight: (_cat, mind, context) => (mind.napCooldown <= 0 ? (0.06 + mind.personality.laziness * 0.2) * (isNight(context) ? 3 : 1) : 0),
  start(cat, mind, context) {
    mind.scratchPoints.center = { x: cat.position.x + cat.facing * sizeScaled(context, 12), y: cat.position.y }
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
    enterPhase(mind, 'circle', randomTimer(context, 2.4, 3.4))
  },
  update(cat, mind, context) {
    if (mind.phase === 'circle') {
      if (phaseDone(mind)) {
        mind.idlePose = 'sleep'
        setEmote(cat, 'sleepy')
        enterPhase(mind, 'sleep', randomTimer(context, 5, 9))
        return zeroVector
      }
      return orbit(cat, mind.scratchPoints.center, sizeScaled(context, 12), sizeScaled(context, 40), -1)
    }
    if (phaseDone(mind)) {
      mind.napCooldown = randomTimer(context, 12, 20)
      return finishBehavior(cat, mind, context)
    }
    return brake(cat)
  },
}
