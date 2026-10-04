import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid, sideToward } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { bumpAgitation } from '../helpers/propUse'
import { randomTimer } from '../helpers/queries'

export const postScratchBehavior = createPropVisit({
  id: 'postScratch',
  kinds: ['scratchingPost'],
  range: 620,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3.5, 6.5],
  speed: 0.5,
  weight: (_cat, mind) => 0.07 + mind.personality.boldness * 0.06,
  spotFor: (post, cat, context) => besideSolid(post, cat, context, sideToward(post, cat.position), 2),
  onArrive(cat) {
    setEmote(cat, 'playful')
  },
  onUse(_cat, mind, context, post) {
    if (mind.decisionTimer > 0) return
    const stretchTurn = mind.attempts % 3 === 2
    mind.attempts += 1
    mind.decisionTimer = randomTimer(context, 1.3, 1.9)
    lockPose(mind, stretchTurn ? 'stretch' : 'scratch', randomTimer(context, 0.9, 1.3))
    bumpAgitation(post, stretchTurn ? 0.1 : 0.4)
  },
})
