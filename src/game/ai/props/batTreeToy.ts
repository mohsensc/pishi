import { CAT_TREE_PLATFORM_OFFSETS } from '../../constants'
import { depthScale } from '../../projection'
import { hopInPlace } from '../helpers/leap'
import { lockPose, setEmote } from '../helpers/pose'
import { besideSolid } from '../helpers/propSpots'
import { createPropVisit } from '../helpers/propVisit'
import { bumpAgitation } from '../helpers/propUse'
import { randomTimer } from '../helpers/queries'
import type { PropState, Vec } from '../../types'
import type { StepContext } from '../../memory'

function toyPoint(tree: PropState, context: StepContext): Vec {
  const drawScale = depthScale(tree.position.y, context.world.height)
  return { x: tree.position.x + CAT_TREE_PLATFORM_OFFSETS[0] * tree.radius * drawScale, y: tree.position.y - tree.perchHeight * 0.3 * drawScale }
}

export const batTreeToyBehavior = createPropVisit({
  id: 'batTreeToy',
  kinds: ['catTree'],
  range: 600,
  minDuration: 5,
  maxDuration: 9,
  useDuration: [3.5, 6],
  weight: (_cat, mind) => 0.05 + mind.personality.zoominess * 0.1,
  spotFor: (tree, cat, context) => besideSolid(tree, cat, context, -1, 6),
  lookAt: (tree, _cat, context) => toyPoint(tree, context),
  onArrive(cat) {
    setEmote(cat, 'playful')
  },
  onUse(cat, mind, context, tree) {
    mind.scratchPoints.gaze = toyPoint(tree, context)
    if (mind.decisionTimer > 0) return
    mind.decisionTimer = randomTimer(context, 0.7, 1.4)
    bumpAgitation(tree, 0.55)
    if (context.memory.random.chance(0.35)) {
      lockPose(mind, 'reach', 0.6)
      return
    }
    hopInPlace(cat, mind, context, randomTimer(context, 14, 28) * mind.personality.jumpPower, 0.34, 'bat', 'none')
  },
})
