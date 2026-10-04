import type { Behavior } from '../behavior'
import { distance } from '../../vector'
import { hideIn } from '../helpers/hiding'
import { setEmote } from '../helpers/pose'
import { startleCat } from '../helpers/reactions'
import { holdSpot, treeBranchSpot } from '../helpers/propSpots'
import { bailIfThreatened, bumpAgitation, enterPhase, finishUse, hasProp, isOvertime, pickProp, releaseProp } from '../helpers/propUse'
import { canHideMore, findProp, randomTimer, zeroVector } from '../helpers/queries'
import { ascendTree, claimTreeSide, isClimbableTree, jumpDownFrom } from './treeClimbing'

export const canopyHideBehavior: Behavior = {
  id: 'canopyHide',
  intent: 'hide',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 10,
  maxDuration: 15,
  weight: (cat, mind, context) =>
    cat.height < 1 && canHideMore(context) && hasProp(cat, context, ['tree'], 600, (tree) => isClimbableTree(tree, cat, context))
      ? 0.1 + mind.personality.boldness * 0.08
      : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['tree'], 600, (tree) => isClimbableTree(tree, cat, context))?.id ?? null
  },
  update(cat, mind, context) {
    const tree = findProp(context, mind.propTargetId)
    if (!tree) return finishUse(cat, mind, context)
    const side = claimTreeSide(tree, cat, mind, context)
    const climbing = ascendTree(cat, mind, context, tree, side, 0.6, () => enterPhase(mind, 'vanish'))
    if (climbing) return climbing
    if (mind.phase === 'vanish') {
      if (!canHideMore(context)) {
        jumpDownFrom(cat, mind, context, tree, side, null)
        return zeroVector
      }
      mind.perch = null
      hideIn(cat, mind, tree, randomTimer(context, 4, 8), context)
      bumpAgitation(tree, 0.4)
      return zeroVector
    }
    if (mind.phase === 'inside') {
      if (context.memory.random.chance(context.dt * 0.4)) bumpAgitation(tree, 0.25)
      if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return zeroVector
      const prey = context.world.cats.find((other) => other.id !== cat.id && !other.hidden && other.height < 1 && distance(other.position, tree.position) < 170 * context.memory.sizeScale)
      cat.hidden = false
      mind.perch = treeBranchSpot(tree, side, context)
      cat.propId = tree.id
      holdSpot(cat, mind)
      bumpAgitation(tree, 0.7)
      if (prey) {
        setEmote(cat, 'playful')
        startleCat(prey, context, tree.position)
      }
      jumpDownFrom(cat, mind, context, tree, side, prey ? { x: prey.position.x - cat.facing * 18, y: prey.position.y + 4 } : null)
      return zeroVector
    }
    if (bailIfThreatened(cat, mind, context, 0.5)) return zeroVector
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
