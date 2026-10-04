import { spawnEffect } from '../../effects'
import { lerpVec } from '../../vector'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { pondEdge } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { randomTimer } from '../helpers/queries'

export const pawAtPondBehavior = createPropVisit({
  id: 'pawAtPond',
  kinds: ['pond'],
  range: 700,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [2.5, 4.5],
  capacity: 2,
  idlePose: 'crouch',
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.1,
  spotFor: (pond, cat, context) => pondEdge(pond, cat.position, cat, context),
  onArrive(cat) {
    setEmote(cat, 'curious')
  },
  onUse(cat, mind, context, pond) {
    mind.idlePose = 'crouch'
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.8, 1.5)
    lockPose(mind, 'bat', 0.3)
    spawnEffect(context.world, 'splash', lerpVec(cat.position, pond.position, 0.3), 0, pond.id, 0.4)
    if (!context.memory.random.chance(0.22)) return
    setAction(cat, 'shakeOff')
    setEmote(cat, 'annoyed')
    hopInPlace(cat, mind, context, 16, 0.3, 'startle', 'startle')
  },
})
