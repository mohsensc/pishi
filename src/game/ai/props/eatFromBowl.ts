import { spawnEffect } from '../../effects'
import { clamp } from '../../vector'
import { setAction, setEmote } from '../helpers/pose'
import { createPropVisit } from '../helpers/propVisit'
import { usersOf } from '../helpers/propUse'
import { bodyLength, catRadius, mouthPoint, randomTimer, settleOnGround } from '../helpers/queries'

export const eatFromBowlBehavior = createPropVisit({
  id: 'eatFromBowl',
  kinds: ['foodBowl'],
  range: 700,
  minDuration: 6,
  maxDuration: 10,
  useDuration: [3.5, 6.5],
  capacity: 2,
  idlePose: 'eat',
  weight: (cat) => 0.03 + (1 - cat.fullness) * 0.16,
  spotFor(bowl, cat, context) {
    const side = cat.position.x < bowl.position.x ? -1 : 1
    const slot = usersOf(context, bowl.id, cat.id).length
    const point = { x: bowl.position.x + side * bodyLength(cat) * 0.44, y: bowl.position.y + 2 + slot * 9 }
    return settleOnGround(point, context, catRadius(cat))
  },
  onArrive(cat) {
    setEmote(cat, 'love')
  },
  onUse(cat, mind, context) {
    mind.idlePose = 'eat'
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.9, 1.4)
    setAction(cat, 'munch')
    cat.fullness = clamp(cat.fullness + 0.1, 0, 1)
    spawnEffect(context.world, 'crumbs', mouthPoint(cat), 4, mind.propTargetId, 0.5)
    if (cat.fullness > 0.97) mind.holdDuration = Math.min(mind.holdDuration, mind.phaseTimer + 0.6)
  },
})
