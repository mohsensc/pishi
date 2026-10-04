import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import { boundsCenter, clampToBounds } from '../../bounds'
import { distance } from '../../vector'
import type { Vec } from '../../types'
import { finishBehavior, paceSpeed, sizeScaled } from '../helpers/playSteering'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake, seek } from '../helpers/steering'
import { hasPartnerNearby, partnerReach, type SocialFrame, socialSetup } from './shared/partners'

const raceId = 'racePair'

function laneStart(frame: SocialFrame, rank: number, context: StepContext): Vec {
  const origin = frame.leaderMind.scratchPoints.origin
  return clampToBounds({ x: origin.x, y: origin.y + rank * sizeScaled(context, 36) }, context.bounds)
}

function laneFinish(frame: SocialFrame, rank: number, context: StepContext): Vec {
  const start = laneStart(frame, rank, context)
  return clampToBounds({ x: start.x + frame.leaderMind.scratchNumbers.direction * frame.leaderMind.scratchNumbers.span, y: start.y }, context.bounds)
}

export const racePairBehavior: Behavior = {
  id: raceId,
  intent: 'socialize',
  interruptible: true,
  minDuration: 9,
  maxDuration: 13,
  weight: (cat, mind, context) => (hasPartnerNearby(cat, context, sizeScaled(context, partnerReach)) ? 0.08 + mind.personality.zoominess * 0.12 : 0),
  start(_cat, mind) {
    mind.movePose = 'walk'
    mind.idlePose = 'crouch'
  },
  update(cat, mind, context) {
    const frame = socialSetup(cat, mind, context, raceId, sizeScaled(context, partnerReach), 1)
    if (!frame) return finishBehavior(cat, mind, context)
    const race = frame.leaderMind.scratchNumbers
    if (frame.isLeader && race.span === undefined) {
      const bounds = context.bounds
      race.direction = cat.position.x < boundsCenter(bounds).x ? 1 : -1
      race.span = Math.min(sizeScaled(context, 460), race.direction > 0 ? bounds.right - cat.position.x : cat.position.x - bounds.left)
      mind.scratchPoints.origin = { x: cat.position.x, y: Math.min(cat.position.y, bounds.bottom - sizeScaled(context, 40)) }
      race.arrived = 0
    }
    if (race.span === undefined) return zeroVector
    const start = laneStart(frame, frame.rank, context)
    const finish = laneFinish(frame, frame.rank, context)
    const clock = frame.leaderMind.behaviorElapsed
    if (clock < 2.4) {
      mind.scratchPoints.gaze = finish
      if (distance(cat.position, start) > 6) return arrive(cat, start, paceSpeed(cat, mind, context, 0.5), 20)
      mind.idlePose = 'crouch'
      return brake(cat)
    }
    if (mind.phase !== 'finished') {
      mind.speedBoost = 1.08
      if (distance(cat.position, finish) < sizeScaled(context, 16) || clock > 8) {
        mind.phase = 'finished'
        mind.speedBoost = 1
        race.arrived += 1
        setEmote(cat, race.arrived === 1 ? 'proud' : 'annoyed')
        mind.idlePose = 'sit'
        return zeroVector
      }
      return seek(cat, finish, paceSpeed(cat, mind, context, 1))
    }
    if (frame.isLeader && (race.arrived >= 2 || clock > 9)) return finishBehavior(cat, mind, context)
    return brake(cat)
  },
}
