import type { Behavior } from '../behavior'
import { setEmote } from '../helpers/pose'
import { bailIfThreatened, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp } from '../helpers/propUse'
import { findProp, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { ascendTree, branchToTrunk, claimTreeSide, isClimbableTree, jumpDownFrom, shimmy, stepOffTrunk } from './treeClimbing'

export const treeClimbBehavior: Behavior = {
  id: 'treeClimb',
  intent: 'useProp',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 10,
  maxDuration: 16,
  weight: (cat, mind, context) =>
    cat.height < 1 && hasProp(cat, context, ['tree'], 640, (tree) => isClimbableTree(tree, cat, context)) ? 0.04 + mind.personality.jumpPower * 0.05 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['tree'], 640, (tree) => isClimbableTree(tree, cat, context))?.id ?? null
  },
  update(cat, mind, context) {
    const tree = findProp(context, mind.propTargetId)
    if (!tree) return finishUse(cat, mind, context)
    const side = claimTreeSide(tree, cat, mind, context)
    const climbing = ascendTree(cat, mind, context, tree, side, 0.5, () => enterPhase(mind, 'branch', randomTimer(context, 2.5, 5)))
    if (climbing) return climbing
    if (mind.phase === 'branch') {
      if (!mind.perch) return finishUse(cat, mind, context)
      cat.position = { ...mind.perch.spot }
      cat.height = mind.perch.height
      mind.idlePose = mind.phaseTimer > 2.5 ? 'loaf' : 'sit'
      mind.scratchPoints.gaze = { x: cat.position.x + Math.sin(cat.clock * 0.5) * 200, y: cat.position.y + 80 }
      if (mind.phaseTimer < 0.2) setEmote(cat, 'proud')
      if (bailIfThreatened(cat, mind, context, 0.45)) return zeroVector
      if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return brake(cat)
      if (context.memory.random.chance(0.5)) {
        jumpDownFrom(cat, mind, context, tree, side, null)
        return zeroVector
      }
      branchToTrunk(cat, mind, context, tree, side)
      enterPhase(mind, 'down')
      return zeroVector
    }
    if (mind.phase === 'down') {
      if (!shimmy(cat, mind, context, -1, 3)) return zeroVector
      stepOffTrunk(cat, mind, context, tree, side)
      return quit(cat, mind, context)
    }
    return finishUse(cat, mind, context)
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
