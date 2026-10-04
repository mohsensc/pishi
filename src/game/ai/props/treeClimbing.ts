import type { CatMind, StepContext } from '../../memory'
import type { CatState, PropState, Vec } from '../../types'
import { distance } from '../../vector'
import { faceToward } from '../helpers/pose'
import { besideSolid, holdSpot, hopToGround, mountSpot, spotFree, treeBranchSpot, treeTrunkSpot } from '../helpers/propSpots'
import { bailIfThreatened, enterPhase, quit, travel } from '../helpers/propUse'
import { catRadius, isOpenGround, randomOpenPoint, zeroVector } from '../helpers/queries'

function treeSideFor(tree: PropState, cat: CatState, context: StepContext): 1 | -1 | null {
  const preferred: 1 | -1 = cat.position.x < tree.position.x ? -1 : 1
  const sides: (1 | -1)[] = [preferred, preferred === 1 ? -1 : 1]
  const free = sides.find((side) => spotFree(context, treeBranchSpot(tree, side, context), cat.id) && spotFree(context, treeTrunkSpot(tree, side, context, 0), cat.id))
  return free ?? null
}

export function isClimbableTree(tree: PropState, cat: CatState, context: StepContext): boolean {
  return tree.occupantIds.every((id) => id === cat.id) && treeSideFor(tree, cat, context) !== null
}

function trunkBase(tree: PropState, cat: CatState, context: StepContext, side: number): Vec {
  return besideSolid(tree, cat, context, side, 4)
}

function beginShimmy(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number, height: number): void {
  const spot = treeTrunkSpot(tree, side, context, height)
  mind.idlePose = 'cling'
  faceToward(cat, mind, tree.position, 0.3)
  cat.facing = side < 0 ? 1 : -1
  if (distance(cat.position, spot.spot) > 6) {
    mountSpot(cat, mind, context, spot, 'jump', 8)
    return
  }
  mind.perch = spot
  cat.propId = tree.id
  holdSpot(cat, mind)
}

export function shimmy(cat: CatState, mind: CatMind, context: StepContext, direction: 1 | -1, goal: number): boolean {
  const spot = mind.perch
  if (!spot) return true
  const scrabble = 0.45 + 0.55 * Math.abs(Math.sin(cat.clock * 7))
  const speed = 85 * mind.personality.jumpPower * scrabble * context.memory.speedScale
  const next = spot.height + direction * speed * context.dt
  spot.height = direction > 0 ? Math.min(goal, next) : Math.max(goal, next)
  mind.idlePose = 'cling'
  holdSpot(cat, mind)
  return spot.height === goal
}

function climbToBranch(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number): void {
  mountSpot(cat, mind, context, treeBranchSpot(tree, side, context), 'jump', 10)
}

export function branchToTrunk(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number): void {
  const branch = treeBranchSpot(tree, side, context)
  mountSpot(cat, mind, context, treeTrunkSpot(tree, side, context, branch.height * 0.72), 'cling', 4)
}

export function jumpDownFrom(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number, toward: Vec | null): void {
  const reach = tree.radius + catRadius(cat) + 40 * context.memory.sizeScale
  let landing = toward ?? { x: tree.position.x + side * reach, y: tree.position.y + reach * 0.4 }
  if (!isOpenGround(landing, context, catRadius(cat))) landing = randomOpenPoint(context, tree.position, reach * 1.4, catRadius(cat))
  hopToGround(cat, mind, context, landing, toward ? 'pounce' : 'jump')
}

export function stepOffTrunk(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number): void {
  mind.perch = null
  cat.propId = null
  cat.height = 0
  cat.position = trunkBase(tree, cat, context, side)
}

export function claimTreeSide(tree: PropState, cat: CatState, mind: CatMind, context: StepContext): number {
  const side = mind.scratchNumbers.side ?? treeSideFor(tree, cat, context) ?? 1
  mind.scratchNumbers.side = side
  return side
}

export function ascendTree(cat: CatState, mind: CatMind, context: StepContext, tree: PropState, side: number, approachPace: number, onBranch: () => void): Vec | null {
  if (mind.phase === 'start' || mind.phase === 'go') {
    if (mind.phase === 'start') enterPhase(mind, 'go')
    if (bailIfThreatened(cat, mind, context)) return zeroVector
    const velocity = travel(cat, mind, context, trunkBase(tree, cat, context, side), approachPace)
    if (velocity) return velocity
    if (!isClimbableTree(tree, cat, context)) return quit(cat, mind, context)
    beginShimmy(cat, mind, context, tree, side, 4)
    enterPhase(mind, 'up')
    return zeroVector
  }
  if (mind.phase === 'up') {
    if (shimmy(cat, mind, context, 1, treeBranchSpot(tree, side, context).height * 0.72)) {
      climbToBranch(cat, mind, context, tree, side)
      onBranch()
    }
    return zeroVector
  }
  return null
}
