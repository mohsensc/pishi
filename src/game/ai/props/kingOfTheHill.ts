import type { Behavior } from '../behavior'
import type { StepContext } from '../../memory'
import type { CatState, PropState } from '../../types'
import { dismount } from '../helpers/perch'
import { setEmote } from '../helpers/pose'
import { holdSpot, hopToGround, mountSpot } from '../helpers/propSpots'
import { bailIfThreatened, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from '../helpers/propUse'
import { findProp, mindOf, randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { isLevelFree, levelOccupant, levelSpot, treeBase } from './catTreeLevels'

const topLevel = 2

function contestable(tree: PropState, cat: CatState, context: StepContext): boolean {
  if (!levelSpot(tree, topLevel, context)) return false
  return isLevelFree(tree, 1, cat, context) || isLevelFree(tree, 0, cat, context)
}

export const kingOfTheHillBehavior: Behavior = {
  id: 'kingOfTheHill',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  minDuration: 9,
  maxDuration: 14,
  weight(cat, mind, context) {
    if (cat.height > 1 || mind.personality.climbLevels < 3) return 0
    const trees = context.world.props.filter((tree) => tree.kind === 'catTree' && contestable(tree, cat, context))
    if (!hasProp(cat, context, ['catTree'], 650, (tree) => trees.includes(tree))) return 0
    const rivalry = trees.some((tree) => levelOccupant(tree, topLevel, cat, context)) ? 3 : 1
    return (0.03 + mind.personality.boldness * 0.05) * rivalry
  },
  start(cat, mind, context) {
    const occupied = pickProp(cat, context, ['catTree'], 650, (tree) => contestable(tree, cat, context) && Boolean(levelOccupant(tree, topLevel, cat, context)))
    mind.propTargetId = (occupied ?? pickProp(cat, context, ['catTree'], 650, (tree) => contestable(tree, cat, context)))?.id ?? null
  },
  update(cat, mind, context) {
    const tree = findProp(context, mind.propTargetId)
    if (!tree) return finishUse(cat, mind, context)
    if (mind.phase === 'start' || mind.phase === 'go') {
      if (mind.phase === 'start') enterPhase(mind, 'go')
      if (bailIfThreatened(cat, mind, context)) return zeroVector
      const stepLevel = isLevelFree(tree, 1, cat, context) ? 1 : 0
      const velocity = travel(cat, mind, context, treeBase(tree, cat, context, stepLevel), 0.75, 14)
      if (velocity) return velocity
      const step = isLevelFree(tree, stepLevel, cat, context) ? levelSpot(tree, stepLevel, context) : null
      if (!step) return quit(cat, mind, context)
      mountSpot(cat, mind, context, step, 'jump', 26)
      enterPhase(mind, 'challenge', randomTimer(context, 0.3, 0.7))
      return zeroVector
    }
    if (!holdSpot(cat, mind)) return finishUse(cat, mind, context)
    if (mind.phase === 'challenge') {
      mind.idlePose = 'crouch'
      const top = levelSpot(tree, topLevel, context)
      if (mind.phaseTimer < mind.holdDuration) return brake(cat)
      if (!top) return finishUse(cat, mind, context)
      const rival = levelOccupant(tree, topLevel, cat, context)
      if (rival) {
        setEmote(rival, 'annoyed')
        const rivalMind = mindOf(rival, context)
        if (!rivalMind.leap) dismount(rival, rivalMind, context, 'ground')
      }
      mountSpot(cat, mind, context, top, 'pounce', 20)
      setEmote(cat, 'proud')
      enterPhase(mind, 'reign', randomTimer(context, 4, 8))
      return zeroVector
    }
    mind.idlePose = 'sit'
    mind.scratchPoints.gaze = { x: cat.position.x + Math.cos(cat.clock * 0.5) * 240, y: cat.position.y + 90 }
    if (mind.decisionTimer <= 0) {
      mind.decisionTimer = randomTimer(context, 2.2, 3.5)
      setEmote(cat, 'proud')
    }
    if (bailIfThreatened(cat, mind, context, 0.4)) return zeroVector
    if (mind.phaseTimer < mind.holdDuration && !isOvertime(cat)) return brake(cat)
    hopToGround(cat, mind, context, treeBase(tree, cat, context, topLevel))
    return zeroVector
  },
  finish(cat, mind, context) {
    releaseProp(cat, mind, context)
  },
}
