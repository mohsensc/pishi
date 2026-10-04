import type { Behavior } from '../behavior'
import { add, distance, normalize, scale, subtract } from '../../vector'
import { edgeBounce, enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace, startLeap } from '../helpers/leap'
import { faceToward, setEmote } from '../helpers/pose'
import { bodyLength, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake, seek } from '../helpers/steering'
import { hasPartnerNearby, partnerReach } from '../play/shared/partners'
import { pairUp, sideSpot } from './pairSetup'

const playBowId = 'playBowInvite'

export const playBowInviteBehavior: Behavior = {
  id: playBowId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 9,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.16 + mind.personality.zoominess * 0.18 : 0),
  start(_cat, mind) {
    mind.movePose = 'run'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const pair = pairUp(cat, mind, context, playBowId)
    if (!pair) return finishBehavior(cat, mind, context)
    const { partner, game, frame } = pair
    mind.scratchPoints.gaze = partner.position
    if (!frame.isLeader) {
      if (game.dash !== 1) {
        mind.idlePose = 'sit'
        faceToward(cat, mind, partner.position, 0.4)
        return brake(cat)
      }
      if (game.caught === 1) {
        mind.idlePose = 'sit'
        return brake(cat)
      }
      if (distance(cat.position, partner.position) < bodyLength(cat) * 1.1 && mind.behaviorElapsed > 1.5) {
        game.caught = 1
        startLeap(cat, mind, context, partner.position, 0, 22, 0.34, 'pounce', 'none')
        setEmote(cat, 'proud')
        return zeroVector
      }
      return seek(cat, partner.position, paceSpeed(cat, mind, context, 0.9))
    }
    if (mind.phase === 'start') {
      const spot = sideSpot(cat, pair, context, 0.75)
      if (distance(cat.position, partner.position) < bodyLength(cat) * 1.5 || mind.phaseTimer > 5) {
        faceToward(cat, mind, partner.position, 2.5)
        mind.idlePose = 'crouch'
        setEmote(cat, 'playful')
        enterPhase(mind, 'bow', randomTimer(context, 1.3, 1.9))
        return zeroVector
      }
      return arrive(cat, spot, paceSpeed(cat, mind, context, 0.5), 16)
    }
    if (mind.phase === 'bow') {
      if (mind.phaseTimer > 0.5 && mind.scratchNumbers.hops === undefined) {
        mind.scratchNumbers.hops = 1
        const lateral = { x: 0, y: context.memory.random.chance(0.5) ? 16 : -16 }
        startLeap(cat, mind, context, add(cat.position, lateral), 0, 12, 0.22, 'hop', 'none')
        return zeroVector
      }
      if (!phaseDone(mind)) return brake(cat)
      const away = normalize(subtract(cat.position, partner.position))
      mind.scratchPoints.heading = away.x === 0 && away.y === 0 ? { x: cat.facing, y: 0 } : away
      game.dash = 1
      mind.speedBoost = 1.1
      enterPhase(mind, 'dash', randomTimer(context, 2.2, 3.2))
      return zeroVector
    }
    if (mind.phase === 'dash') {
      if (phaseDone(mind) || game.caught === 1) {
        mind.speedBoost = 1
        mind.idlePose = 'bellyUp'
        setEmote(cat, 'love')
        enterPhase(mind, 'roll', randomTimer(context, 1.2, 1.8))
        return brake(cat, 6)
      }
      const bounce = edgeBounce(cat, mind.scratchPoints.heading ?? { x: 1, y: 0 }, context, sizeScaled(context, 50))
      mind.scratchPoints.heading = bounce.heading
      if (bounce.bounced && context.memory.random.chance(0.5)) hopInPlace(cat, mind, context, 14, 0.24, 'hop')
      return scale(normalize(bounce.heading), paceSpeed(cat, mind, context, 0.92))
    }
    if (phaseDone(mind)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
