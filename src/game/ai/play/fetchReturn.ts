import type { Behavior } from '../behavior'
import { add, distance, normalize, scale, subtract } from '../../vector'
import { forgetBallHolder } from '../../care/catchTracking'
import { offerBall } from '../../dragging/handlingMemory'
import { releaseBall } from '../helpers/ball'
import { setEmote } from '../helpers/pose'
import { zeroVector } from '../helpers/queries'
import { arrive, brake } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'
import { enterPhase, gazeAt, phaseDone } from '../tools/support/phases'

const dropDistance = 58
const offerSeconds = 6

export const fetchReturnBehavior: Behavior = {
  id: 'fetchReturn',
  intent: 'carryBall',
  interruptible: false,
  ownsTimer: true,
  withBall: true,
  recencyPenalty: 0,
  minDuration: 8,
  maxDuration: 8,
  weight: () => 0,
  start(cat, mind, context) {
    mind.scratchPoints.home = { x: context.pointer.position.x, y: context.pointer.position.y }
    mind.movePose = 'walk'
    setEmote(cat, 'proud')
    enterPhase(mind, 'return')
  },
  update(cat, mind, context) {
    const pointer = context.pointer
    if (mind.phase === 'wait') {
      mind.idlePose = 'sit'
      if (pointer.active) gazeAt(cat, mind, pointer.position, 0.4)
      if (phaseDone(mind) || !pointer.active) endBehavior(cat, mind, context)
      return brake(cat)
    }
    if (!cat.heldBallId) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    const destination = pointer.active ? { x: pointer.position.x, y: pointer.position.y + 10 } : mind.scratchPoints.home
    if (!destination) {
      endBehavior(cat, mind, context)
      return zeroVector
    }
    gazeAt(cat, mind, destination, 0.3)
    const gap = distance(cat.position, destination)
    const reach = dropDistance * cat.coat.scale * context.memory.sizeScale
    if (gap < reach || mind.behaviorElapsed > 9) {
      const toward = normalize(subtract(destination, cat.position))
      const ball = releaseBall(cat, mind, context, add(scale(toward, 50), { x: 0, y: 10 }), 140, 2.5)
      if (ball) {
        offerBall(context.world, ball.id, offerSeconds)
        forgetBallHolder(context.world, ball.id)
      }
      setEmote(cat, cat.affection > 0.5 ? 'love' : 'playful')
      enterPhase(mind, 'wait', context.memory.random.range(1.4, 2.8))
      return brake(cat)
    }
    const trot = gap > reach * 3 ? 0.62 : 0.4
    return arrive(cat, { x: destination.x - cat.facing * reach * 0.6, y: destination.y }, topSpeed(cat, mind, context) * trot, 50)
  },
}
