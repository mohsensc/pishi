import { spawnEffect } from '../../effects'
import { POND_ASPECT } from '../../constants'
import { hopInPlace } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { pondEdge } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { randomTimer } from '../helpers/queries'

export const fishWatchBehavior = createPropVisit({
  id: 'fishWatch',
  kinds: ['pond'],
  range: 700,
  minDuration: 6,
  maxDuration: 11,
  useDuration: [5, 9],
  capacity: 2,
  speed: 0.3,
  movePose: 'stalk',
  idlePose: 'crouch',
  weight: (_cat, mind) => 0.04 + mind.personality.curiosity * 0.08,
  spotFor: (pond, cat, context) => pondEdge(pond, cat.position, cat, context),
  onArrive(cat, mind, context) {
    setEmote(cat, 'curious')
    mind.decisionTimer = randomTimer(context, 2.5, 4)
  },
  onUse(cat, mind, context, pond) {
    mind.idlePose = 'crouch'
    const fish = {
      x: pond.position.x + Math.cos(cat.clock * 0.9) * pond.radius * 0.45,
      y: pond.position.y + Math.sin(cat.clock * 1.3) * pond.radius * POND_ASPECT * 0.4,
    }
    mind.scratchPoints.gaze = fish
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 2.5, 4.5)
    hopInPlace(cat, mind, context, 14, 0.28, 'pounce', 'none')
    spawnEffect(context.world, 'splash', fish, 0, pond.id, 0.3)
    if (context.memory.random.chance(0.3)) setEmote(cat, 'playful')
  },
})
