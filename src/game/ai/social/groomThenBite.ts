import type { Behavior } from '../behavior'
import { distance, normalize, scale, subtract } from '../../vector'
import { enterPhase, finishBehavior, paceSpeed, phaseDone, sizeScaled } from '../helpers/playSteering'
import { hopInPlace } from '../helpers/leap'
import { faceToward, lockPose, setEmote } from '../helpers/pose'
import { bodyLength, randomTimer, zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { hasPartnerNearby, partnerReach } from '../play/shared/partners'
import { pairUp, sideSpot } from './pairSetup'

const groomBiteId = 'groomThenBite'

export const groomThenBiteBehavior: Behavior = {
  id: groomBiteId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 9,
  maxDuration: 12,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.12 + cat.affection * 0.14 + mind.personality.boldness * 0.06 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const pair = pairUp(cat, mind, context, groomBiteId)
    if (!pair) return finishBehavior(cat, mind, context)
    const { partner, game, frame } = pair
    mind.scratchPoints.gaze = partner.position
    if (!frame.isLeader && game.bitten === 1 && mind.phase !== 'bolt') {
      lockPose(mind, 'arch', 0.45)
      setEmote(cat, 'annoyed')
      enterPhase(mind, 'bolt', randomTimer(context, 1, 1.5))
      return zeroVector
    }
    if (mind.phase === 'start') {
      const spot = sideSpot(cat, pair, context, frame.isLeader ? 0.45 : 0.4)
      if (distance(cat.position, partner.position) < bodyLength(cat) * 0.95 || mind.phaseTimer > 5) {
        faceToward(cat, mind, partner.position, 3)
        enterPhase(mind, 'groom', randomTimer(context, 2.2, 3.6))
        mind.idlePose = frame.isLeader ? 'groom' : 'purr'
        setEmote(cat, 'love')
        return zeroVector
      }
      return arrive(cat, spot, paceSpeed(cat, mind, context, frame.isLeader ? 0.36 : 0.22), 16)
    }
    if (mind.phase === 'groom') {
      if (frame.isLeader && phaseDone(mind)) {
        hopInPlace(cat, mind, context, 10, 0.2, 'pounce')
        setEmote(cat, 'playful')
        game.bitten = 1
        enterPhase(mind, 'bolt', randomTimer(context, 1, 1.5))
        return zeroVector
      }
      return brake(cat)
    }
    if (mind.phase === 'bolt') {
      if (phaseDone(mind)) return frame.isLeader ? finishBehavior(cat, mind, context) : brake(cat)
      mind.idlePose = 'sit'
      const away = normalize(subtract(cat.position, partner.position))
      return scale(away.x === 0 && away.y === 0 ? { x: cat.facing, y: 0 } : away, paceSpeed(cat, mind, context, 0.95))
    }
    return brake(cat)
  },
}
