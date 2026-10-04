import type { Behavior } from '../behavior'
import { setEmote } from '../helpers/pose'
import { holdSpot, hopToGround, mountSpot } from '../helpers/propSpots'
import { bailIfThreatened, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { isLevelFree, levelSpot, reachableLevels, treeBase } from './catTreeLevels'

export const catTreeAscentBehavior: Behavior = {
  id: 'catTreeAscent',
  intent: 'useProp',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 10,
  maxDuration: 16,
  weight: (cat, mind, context) =>
    cat.height < 1 && hasProp(cat, context, ['catTree'], 620, (tree) => isLevelFree(tree, 0, cat, context)) ? 0.05 + mind.personality.jumpPower * 0.05 : 0,
  start(cat, mind, context) {
    mind.propTargetId = pickProp(cat, context, ['catTree'], 620, (tree) => isLevelFree(tree, 0, cat, context))?.id ?? null
  },
  update(cat, mind, context) {
    const tree = findProp(context, mind.propTargetId)
    if (!tree) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      if (bailIfThreatened(cat, mind, context)) return zeroVector
      const velocity = travel(cat, mind, context, treeBase(tree, cat, context, 0), 0.5, 14)
      if (velocity) return velocity
      const first = levelSpot(tree, 0, context)
      if (!first || !isLevelFree(tree, 0, cat, context)) return quit(cat, mind, context)
      mountSpot(cat, mind, context, first, 'jump')
      mind.scratchNumbers.level = 0
      enterPhase(mind, 'level', randomTimer(context, 0.8, 1.6))
      return zeroVector
    }
    if (!holdSpot(cat, mind)) return finishUse(cat, mind, context)
    if (bailIfThreatened(cat, mind, context, 0.5)) return zeroVector
    const level = mind.scratchNumbers.level ?? 0
    const top = reachableLevels(tree, mind, context) - 1
    mind.idlePose = mind.phaseTimer > 1.5 ? 'loaf' : 'sit'
    mind.scratchPoints.gaze = { x: cat.position.x + Math.sin(cat.clock * 0.7) * 160, y: cat.position.y + 50 }
    if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return brake(cat)
    const climbing = mind.phase === 'level' && level < top && isLevelFree(tree, level + 1, cat, context) && !isOvertime(cat)
    const nextLevel = climbing ? level + 1 : level - 1
    const next = mind.phase !== 'descend' || context.memory.random.chance(0.6) ? levelSpot(tree, nextLevel, context) : null
    if (next && nextLevel >= 0 && (climbing || isLevelFree(tree, nextLevel, cat, context))) {
      mountSpot(cat, mind, context, next, climbing ? 'jump' : 'hop', climbing ? 18 : 8)
      mind.scratchNumbers.level = nextLevel
      const reachedTop = climbing && nextLevel === top
      if (reachedTop) setEmote(cat, 'proud')
      enterPhase(mind, climbing && !reachedTop ? 'level' : 'descend', randomTimer(context, reachedTop ? 1.8 : 0.6, reachedTop ? 3.2 : 1.3))
      return zeroVector
    }
    hopToGround(cat, mind, context, treeBase(tree, cat, context, Math.max(0, level)))
    return zeroVector
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
