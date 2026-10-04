import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import { clampToBounds } from '../../bounds'
import { startLeap } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { enterPhase, hasProp, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { catRadius, findProp, randomTimer, settleOnGround, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { facingRingPoint } from './shopItemSpots'

const bubbleRange = 720

export const chaseBubblesBehavior: Behavior = {
  id: 'chaseBubbles',
  intent: 'play',
  interruptible: true,
  minDuration: 5,
  maxDuration: 10,
  weight(cat, mind, context) {
    const base = 0.09 + mind.personality.zoominess * 0.16
    return hasProp(cat, context, ['bubbleMachine'], bubbleRange) ? base : 0
  },
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['bubbleMachine'], bubbleRange)?.id ?? null
    mind.movePose = 'run'
    mind.idlePose = 'crouch'
    mind.scratchNumbers.pounces = context.memory.random.integer(3, 6)
    mind.attempts = 0
  },
  update(cat, mind, context) {
    const machine = findProp(context, mind.propTargetId)
    if (!machine) return quit(cat, mind, context)
    const scale = context.memory.sizeScale
    if (mind.phase === 'start') {
      mind.scratchPoints.spot = facingRingPoint(machine, cat, context, 30 * scale)
      enterPhase(mind, 'go')
    }
    if (mind.phase === 'go') {
      const velocity = travel(cat, mind, context, mind.scratchPoints.spot ?? machine.position, 0.75, 16)
      if (velocity) return velocity
      setEmote(cat, 'playful')
      enterPhase(mind, 'aim', randomTimer(context, 0.25, 0.5))
      return brake(cat)
    }
    if (mind.phase === 'aim') {
      const random = context.memory.random
      const bubble = { x: machine.position.x + random.range(-90, 90) * scale, y: machine.position.y + random.range(-20, 50) * scale }
      mind.scratchPoints.gaze = { x: bubble.x, y: bubble.y - 60 * scale }
      if (mind.phaseTimer < mind.holdDuration) return brake(cat, 6)
      const landing = settleOnGround(clampToBounds(bubble, context.bounds), context, catRadius(cat))
      const peak = random.range(30, 56) * mind.personality.jumpPower
      startLeap(cat, mind, context, landing, 0, peak, 0.42, 'pounce', 'none')
      mind.scratchPoints.pop = landing
      mind.scratchNumbers.peak = peak
      mind.attempts += 1
      enterPhase(mind, 'swat', 0.3)
      return zeroVector
    }
    if (mind.phase === 'swat') {
      if (mind.phaseTimer < mind.holdDuration) return brake(cat)
      lockPose(mind, 'bat', 0.3)
      const pop = mind.scratchPoints.pop ?? cat.position
      spawnEffect(context.world, 'bubbles', pop, (mind.scratchNumbers.peak ?? 30) + 20 * scale, machine.id, 0.45)
      if (mind.attempts >= (mind.scratchNumbers.pounces ?? 4)) {
        setEmote(cat, 'proud')
        enterPhase(mind, 'done', 0.8)
        return zeroVector
      }
      enterPhase(mind, 'aim', randomTimer(context, 0.3, 0.8))
      return zeroVector
    }
    if (mind.phaseTimer > mind.holdDuration) return quit(cat, mind, context)
    return brake(cat)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
