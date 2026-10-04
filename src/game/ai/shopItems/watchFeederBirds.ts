import type { Behavior } from '../behavior'
import { birdsPresent, hasBirdPerch } from '../../shopItems/birdVisits'
import { add, normalize, scale, subtract } from '../../vector'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { enterPhase, hasProp, pickProp, quit, releaseProp, settleAt, travel } from '../helpers/propUse'
import { catRadius, findProp, randomTimer, settleOnGround, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { clampToBounds } from '../../bounds'
import { headPoint } from './shopItemSpots'

const birdKinds = ['birdFeeder', 'birdbath'] as const
const watchRange = 760
const perchHeights = { birdFeeder: 96, birdbath: 44 }

export const watchFeederBirdsBehavior: Behavior = {
  id: 'watchFeederBirds',
  intent: 'useProp',
  interruptible: true,
  minDuration: 6,
  maxDuration: 12,
  weight(cat, mind, context) {
    const base = 0.06 + mind.personality.curiosity * 0.12
    return hasProp(cat, context, birdKinds, watchRange, (prop) => hasBirdPerch(prop) && birdsPresent(context.world, prop)) ? base : 0
  },
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, birdKinds, watchRange, (prop) => birdsPresent(context.world, prop))?.id ?? null
    mind.movePose = 'stalk'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    const prop = findProp(context, mind.propTargetId)
    if (!prop) return quit(cat, mind, context)
    const perch = headPoint(prop, context, prop.kind === 'birdFeeder' ? perchHeights.birdFeeder : perchHeights.birdbath)
    mind.scratchPoints.gaze = { x: perch.x + Math.sin(cat.clock * 1.7) * 8, y: perch.y }
    if (mind.phase === 'start') {
      const away = normalize(subtract(cat.position, prop.position))
      const direction = away.x === 0 && away.y === 0 ? { x: 1, y: 0.3 } : away
      const reach = prop.radius + 120 * context.memory.sizeScale
      mind.scratchPoints.spot = settleOnGround(clampToBounds(add(prop.position, scale(direction, reach)), context.bounds), context, catRadius(cat))
      enterPhase(mind, 'go')
    }
    if (mind.phase === 'go') {
      const velocity = travel(cat, mind, context, mind.scratchPoints.spot ?? prop.position, 0.32, 14)
      if (velocity) return velocity
      setEmote(cat, 'curious')
      return settleAt(cat, mind, context, perch, 'watch', 3.5, 7)
    }
    if (mind.phase === 'watch') {
      mind.idlePose = Math.sin(cat.clock * 1.1) > 0.6 ? 'stalk' : 'crouch'
      if (!birdsPresent(context.world, prop)) {
        setEmote(cat, 'annoyed')
        enterPhase(mind, 'sulk', randomTimer(context, 0.8, 1.4))
        return brake(cat)
      }
      if (mind.phaseTimer < mind.holdDuration) return brake(cat, 6)
      if (!context.memory.random.chance(0.35 + mind.personality.boldness * 0.4)) return quit(cat, mind, context)
      const landing = settleOnGround(add(prop.position, scale(normalize(subtract(cat.position, prop.position)), prop.radius + catRadius(cat) + 4)), context, catRadius(cat))
      lockPose(mind, 'crouch', 0.3)
      startLeap(cat, mind, context, landing, 0, 34 * mind.personality.jumpPower, 0.42, 'pounce', 'none')
      setEmote(cat, 'playful')
      enterPhase(mind, 'sulk', randomTimer(context, 1.2, 2))
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) return quit(cat, mind, context)
    mind.idlePose = 'sit'
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
