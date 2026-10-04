import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { aimToss } from '../../physics'
import { add, clamp, distance, scale } from '../../vector'
import { releaseBall } from '../helpers/ball'
import { lockPose } from '../helpers/pose'
import { findBall, findCat, mindOf, mouthPoint, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { threatened } from '../helpers/threat'
import { beginBehavior, beginChase, beginFlee, endBehavior, resumeAfterAction } from '../helpers/transitions'

export const passBallBehavior: Behavior = {
  id: 'passBall',
  intent: 'passBall',
  interruptible: false,
  ownsTimer: true,
  withBall: true,
  minDuration: 2,
  maxDuration: 2,
  weight: () => 0,
  start() {},
  update(cat, mind, context) {
    const teammate = findCat(context, mind.teammateId)
    const ball = findBall(context, cat.heldBallId)
    if (!ball || !teammate || teammate.hidden || teammate.heldBallId) {
      resumeAfterAction(cat, mind, context)
      return zeroVector
    }
    cat.facing = teammate.position.x >= cat.position.x ? 1 : -1
    mind.facingHold = 0.4
    mind.idlePose = 'crouch'
    if (mind.phaseTimer < 0.16 / cat.speedMultiplier) return brake(cat, 5)
    const teammateMind = mindOf(teammate, context)
    const landing = clampToBounds(add(teammate.position, scale(teammate.velocity, 0.35)), context.bounds)
    const mouth = mouthPoint(cat)
    const flightTime = clamp(distance(mouth, landing) / (560 * context.memory.speedScale), 0.42, 0.95)
    const startHeight = cat.height + 14 * cat.coat.scale
    ball.position = mouth
    ball.height = startHeight
    const toss = aimToss(mouth, startHeight, landing, flightTime)
    const released = releaseBall(cat, mind, context, toss.velocity, toss.verticalSpeed, 1)
    if (released) released.height = startHeight
    lockPose(mind, 'bat', 0.3)
    if (released && !teammateMind.leap) {
      beginChase(teammate, teammateMind, context, released, 1.1)
      teammateMind.phase = 'receive'
      teammate.intentTimer = 3
    }
    if (mind.perch) beginBehavior(cat, mind, context, 'perch', { duration: randomTimer(context, 1.5, 3) })
    else if (threatened(cat, mind, context, 1.1)) beginFlee(cat, mind, context, 1.2)
    else endBehavior(cat, mind, context)
    return zeroVector
  },
}
