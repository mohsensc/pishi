import type { Behavior } from '../behavior'
import { lockPose, setEmote } from '../helpers/pose'
import { ringPoint } from '../helpers/propSpots'
import { bumpAgitation, commit, enterPhase, hasProp, isPropBusy, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { catRadius, findProp, randomTimer } from '../helpers/queries'
import { brake, orbit } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'

export const lampRubBehavior: Behavior = {
  id: 'lampRub',
  intent: 'socialize',
  interruptible: true,
  minDuration: 6,
  maxDuration: 10,
  weight: (cat, _mind, context) => (hasProp(cat, context, ['lamppost', 'scratchingPost'], 620, (post) => !isPropBusy(context, post, cat.id)) ? 0.04 + cat.affection * 0.1 : 0),
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['lamppost', 'scratchingPost'], 620, (post) => !isPropBusy(context, post, cat.id))?.id ?? null
    mind.movePose = 'walk'
  },
  update(cat, mind, context) {
    const post = findProp(context, mind.propTargetId)
    if (!post) return quit(cat, mind, context)
    if (mind.phase === 'start') {
      mind.scratchPoints.spot = ringPoint(post, cat, context, Math.atan2(cat.position.y - post.position.y, cat.position.x - post.position.x), 6)
      enterPhase(mind, 'go')
    }
    if (mind.phase === 'go') {
      const spot = mind.scratchPoints.spot
      const velocity = spot ? travel(cat, mind, context, spot, 0.4, 10) : null
      if (velocity) return velocity
      commit(mind)
      setEmote(cat, 'love')
      mind.scratchNumbers.direction = context.memory.random.sign()
      enterPhase(mind, 'rub', randomTimer(context, 4, 7))
      cat.intentTimer = Math.max(cat.intentTimer, mind.holdDuration + 0.5)
    }
    if (mind.phaseTimer > mind.holdDuration) {
      lockPose(mind, 'purr', 0.8)
      return quit(cat, mind, context)
    }
    if (mind.decisionTimer <= 0) {
      mind.decisionTimer = randomTimer(context, 1, 1.7)
      mind.scratchNumbers.direction = -(mind.scratchNumbers.direction ?? 1)
      bumpAgitation(post, 0.15)
      if (context.memory.random.chance(0.35)) setEmote(cat, 'love')
      return brake(cat, 8)
    }
    const direction = (mind.scratchNumbers.direction ?? 1) >= 0 ? 1 : -1
    return orbit(cat, post.position, post.radius + catRadius(cat) + 1, topSpeed(cat, mind, context) * 0.22, direction)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
