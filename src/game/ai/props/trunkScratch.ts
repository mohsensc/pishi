import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid, sideToward } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { bumpAgitation } from '../helpers/propUse'
import { randomTimer } from '../helpers/queries'

export const trunkScratchBehavior = createPropVisit({
  id: 'trunkScratch',
  kinds: ['tree'],
  range: 560,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3.5, 6],
  weight: (_cat, mind) => 0.05 + mind.personality.boldness * 0.05,
  spotFor: (tree, cat, context) => besideSolid(tree, cat, context, sideToward(tree, cat.position), 2),
  onUse(cat, mind, context, tree) {
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 1.5, 2.2)
    lockPose(mind, 'scratch', randomTimer(context, 1, 1.5))
    bumpAgitation(tree, 0.12)
    if (context.memory.random.chance(0.25)) setEmote(cat, 'proud')
  },
})
