import type { Behavior } from '../behavior'
import { distance, normalize, scale, subtract } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { faceToward, lockPose, setEmote } from '../helpers/pose'
import { bodyLength, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake, seek } from '../helpers/steering'
import { every } from '../tools/support/phases'
import { hasPartnerNearby, partnerReach } from '../play/shared/partners'
import { pairUp, sideSpot } from './pairSetup'

const boxingId = 'boxingMatch'

export const boxingMatchBehavior: Behavior = {
  id: boxingId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 8,
  maxDuration: 11,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.16 + mind.personality.boldness * 0.12 + mind.personality.zoominess * 0.08 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const pair = pairUp(cat, mind, context, boxingId)
    if (!pair) return finishBehavior(cat, mind, context)
    const { partner, game, frame } = pair
    mind.scratchPoints.gaze = partner.position
    if (frame.isLeader && game.bell === undefined && mind.phase === 'spar' && mind.phaseTimer > mind.holdDuration) {
      game.bell = 1
      game.chaser = context.memory.random.chance(0.5) ? 0 : 1
    }
    if (game.bell === 1 && mind.phase !== 'scatter') {
      enterPhase(mind, 'scatter', randomTimer(context, 1.4, 2))
      mind.idlePose = 'sit'
      setEmote(cat, frame.rank === game.chaser ? 'playful' : 'startled')
    }
    if (mind.phase === 'start') {
      const spot = sideSpot(cat, pair, context, 0.5)
      if (distance(cat.position, partner.position) < bodyLength(cat) * 1.1 || mind.phaseTimer > 5) {
        faceToward(cat, mind, partner.position, 4)
        enterPhase(mind, 'spar', randomTimer(context, 2.8, 4.2))
        mind.idlePose = 'reach'
        setEmote(cat, 'playful')
        return zeroVector
      }
      return arrive(cat, spot, paceSpeed(cat, mind, context, 0.45), 16)
    }
    if (mind.phase === 'spar') {
      faceToward(cat, mind, partner.position, 0.5)
      if (every(mind, context, 'swat', 0.55)) {
        if (context.memory.random.chance(0.3)) hopInPlace(cat, mind, context, 12, 0.24, 'pounce')
        else lockPose(mind, 'bat', 0.26)
        return zeroVector
      }
      mind.idlePose = Math.sin(cat.clock * 5 + (frame.rank ? 1.4 : 0)) > 0.3 ? 'reach' : 'crouch'
      return brake(cat)
    }
    if (mind.phase === 'scatter') {
      if (phaseDone(mind)) return frame.isLeader ? finishBehavior(cat, mind, context) : brake(cat)
      if (frame.rank === game.chaser) return seek(cat, partner.position, paceSpeed(cat, mind, context, 0.85))
      const away = normalize(subtract(cat.position, partner.position))
      return scale(away.x === 0 && away.y === 0 ? { x: cat.facing, y: 0 } : away, paceSpeed(cat, mind, context, 0.95))
    }
    return brake(cat)
  },
}
