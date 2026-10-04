import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import type { PropKind } from '../../types'
import { lockPose } from '../helpers/pose'
import { findProp, pointBeside, randomTimer, zeroVector } from '../helpers/queries'
import { arrive } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'
import { endBehavior } from '../helpers/transitions'

const visitKinds: PropKind[] = ['foodBowl', 'scratchingPost', 'yarnBasket', 'flowerBed', 'picnicBlanket']

export const visitPropBehavior: Behavior = {
  id: 'visitProp',
  intent: 'wander',
  interruptible: true,
  minDuration: 5,
  maxDuration: 9,
  weight: (_cat, _mind, context) => (context.world.props.some((prop) => visitKinds.includes(prop.kind)) ? 0.22 : 0),
  start(cat, mind, context) {
    const spots = context.world.props.filter((prop) => visitKinds.includes(prop.kind))
    if (spots.length === 0) return
    const prop = context.memory.random.pick(spots)
    mind.phase = 'visit'
    mind.propTargetId = prop.id
    mind.target = pointBeside(prop, cat, context, cat.position.x < prop.position.x ? -1 : 1)
  },
  update(cat, mind, context) {
    if (mind.phase === 'visit' && mind.target) {
      if (distance(cat.position, mind.target) >= 10) return arrive(cat, mind.target, topSpeed(cat, mind, context) * 0.38)
      const prop = findProp(context, mind.propTargetId)
      mind.phase = 'linger'
      mind.phaseTimer = 0
      mind.holdDuration = randomTimer(context, 0.9, 2)
      if (prop) cat.facing = prop.position.x >= cat.position.x ? 1 : -1
      mind.facingHold = 1
      if (prop?.kind === 'scratchingPost') lockPose(mind, 'scratch', 1.8)
      else if (prop?.kind === 'yarnBasket') lockPose(mind, 'bat', 0.5)
      mind.idlePose = prop?.kind === 'foodBowl' ? 'eat' : prop?.kind === 'picnicBlanket' ? 'loaf' : prop?.kind === 'flowerBed' ? 'sniff' : 'sit'
      return zeroVector
    }
    if (mind.phase === 'linger' && mind.phaseTimer <= mind.holdDuration) return zeroVector
    endBehavior(cat, mind, context)
    return zeroVector
  },
}
