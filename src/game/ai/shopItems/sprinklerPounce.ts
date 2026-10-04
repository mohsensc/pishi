import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { clampToBounds } from '../../bounds'
import { SPRINKLER_PLAY_ID, SPRINKLER_REACH } from '../../shopItems/sprinklerSpray'
import { startLeap } from '../helpers/leap'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { enterPhase, hasProp, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { catRadius, findProp, randomTimer, settleOnGround, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'

const sprinklerRange = 700

export const sprinklerPounceBehavior: Behavior = {
  id: SPRINKLER_PLAY_ID,
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight(cat, mind, context) {
    const base = 0.03 + mind.personality.zoominess * mind.personality.boldness * 0.3
    return hasProp(cat, context, ['sprinkler'], sprinklerRange) ? base : 0
  },
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['sprinkler'], sprinklerRange)?.id ?? null
    mind.movePose = 'run'
    mind.idlePose = 'crouch'
    mind.scratchNumbers.pounces = context.memory.random.integer(2, 4)
    mind.attempts = 0
  },
  update(cat, mind, context) {
    const sprinkler = findProp(context, mind.propTargetId)
    if (!sprinkler) return quit(cat, mind, context)
    const scale = context.memory.sizeScale
    const edge = SPRINKLER_REACH * scale * 1.1
    if (mind.phase === 'start') {
      const angle = Math.atan2(cat.position.y - sprinkler.position.y, cat.position.x - sprinkler.position.x)
      mind.scratchPoints.spot = settleOnGround(clampToBounds({ x: sprinkler.position.x + Math.cos(angle) * edge, y: sprinkler.position.y + Math.sin(angle) * edge * 0.6 }, context.bounds), context, catRadius(cat))
      enterPhase(mind, 'go')
    }
    if (mind.phase === 'go') {
      const velocity = travel(cat, mind, context, mind.scratchPoints.spot ?? sprinkler.position, 0.7, 16)
      if (velocity) return velocity
      setEmote(cat, 'playful')
      enterPhase(mind, 'aim', randomTimer(context, 0.4, 0.9))
      return brake(cat)
    }
    if (mind.phase === 'aim') {
      mind.scratchPoints.gaze = { x: sprinkler.position.x, y: sprinkler.position.y - 30 * scale }
      if (mind.phaseTimer < mind.holdDuration) return brake(cat, 6)
      const random = context.memory.random
      const angle = random.range(0, Math.PI * 2)
      const reach = random.range(0.45, 0.85) * SPRINKLER_REACH * scale
      const droplet = { x: sprinkler.position.x + Math.cos(angle) * reach, y: sprinkler.position.y + Math.sin(angle) * reach * 0.6 }
      startLeap(cat, mind, context, settleOnGround(clampToBounds(droplet, context.bounds), context, catRadius(cat)), 0, random.range(20, 40), 0.38, 'pounce', 'none')
      mind.attempts += 1
      enterPhase(mind, 'land', 0.4)
      return zeroVector
    }
    if (mind.phase === 'land') {
      if (mind.phaseTimer < mind.holdDuration) return brake(cat)
      lockPose(mind, 'bat', 0.3)
      spawnEffect(context.world, 'splash', cat.position, 0, sprinkler.id, 0.35)
      if (mind.attempts >= (mind.scratchNumbers.pounces ?? 3)) {
        setAction(cat, 'shakeOff')
        enterPhase(mind, 'done', 1)
        return zeroVector
      }
      enterPhase(mind, 'aim', randomTimer(context, 0.5, 1))
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) return quit(cat, mind, context)
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
