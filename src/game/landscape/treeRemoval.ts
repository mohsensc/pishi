import { popOut } from '../ai/helpers/hiding'
import { startleCat } from '../ai/helpers/reactions'
import { scatterButterflies } from '../butterflies'
import { forfeitHolding } from '../economy/refund'
import { spendTreeCharge } from '../economy/treeCharges'
import { spawnEffect } from '../effects'
import { hidingHeightOf } from '../layout'
import type { StepContext } from '../memory'
import { depthScale } from '../projection'
import { removeProp } from '../spawning'
import type { PropState } from '../types'
import { distance } from '../vector'
import { landscapeOf } from './landscapeState'
import { FELLED_MEMORY_SECONDS } from './landscapeTypes'

export type TreeRemovalResult = { ok: true; propId: string; chargesLeft: number } | { ok: false; propId: string; reason: 'notTree' | 'noCharges' }

const startleReach = 210
const rustleReach = 190
const butterflyReach = 280

function fallDirectionOf(tree: PropState, context: StepContext): 1 | -1 {
  const reach = rustleReach * 1.6 * context.memory.sizeScale
  let lean = 0
  context.world.props.forEach((other) => {
    if (other.id === tree.id || !other.solid) return
    const gap = distance(other.position, tree.position)
    if (gap < reach) lean += (other.position.x < tree.position.x ? 1 : -1) * (1 - gap / reach)
  })
  context.world.cats.forEach((cat) => {
    const gap = distance(cat.position, tree.position)
    if (gap < reach) lean += (cat.position.x < tree.position.x ? 0.6 : -0.6) * (1 - gap / reach)
  })
  if (Math.abs(lean) < 0.15) return context.memory.random.sign()
  return lean > 0 ? 1 : -1
}

function shakeLooseClimbers(tree: PropState, context: StepContext): void {
  context.world.cats.filter((cat) => cat.propId === tree.id && !cat.hidden).forEach((cat) => popOut(cat, tree, context, true))
}

function alarmNeighbors(tree: PropState, context: StepContext): void {
  const { world, memory } = context
  const startleRadius = startleReach * memory.sizeScale
  world.cats.forEach((cat) => {
    if (cat.propId !== tree.id && distance(cat.position, tree.position) < startleRadius) startleCat(cat, context, tree.position)
  })
  world.props.forEach((other) => {
    if (other.kind !== 'tree' || other.id === tree.id) return
    const gap = distance(other.position, tree.position)
    if (gap > rustleReach * memory.sizeScale) return
    other.agitation = Math.max(other.agitation, 0.6 * (1 - gap / (rustleReach * memory.sizeScale)) + 0.2)
    other.pokedAt = world.time
  })
  scatterButterflies(world, tree.position, butterflyReach * memory.sizeScale)
}

function shedLeaves(tree: PropState, context: StepContext): void {
  spawnEffect(context.world, 'leaves', tree.position, hidingHeightOf(tree, context.world.height) * 0.9, null, 1.3)
}

export function removeTree(context: StepContext, propId: string): TreeRemovalResult {
  const { world } = context
  const tree = world.props.find((prop) => prop.id === propId && prop.kind === 'tree')
  if (!tree) return { ok: false, propId, reason: 'notTree' }
  const charge = spendTreeCharge(context, propId)
  if (!charge.ok) return { ok: false, propId, reason: 'noCharges' }
  const direction = fallDirectionOf(tree, context)
  forfeitHolding(context, propId)
  shakeLooseClimbers(tree, context)
  removeProp(world, propId)
  alarmNeighbors(tree, context)
  shedLeaves(tree, context)
  const landscape = landscapeOf(world)
  landscape.serial += 1
  landscape.felled = [
    ...landscape.felled.filter((felled) => world.time - felled.time < FELLED_MEMORY_SECONDS),
    { id: `felled-${landscape.serial}`, propId, position: { ...tree.position }, radius: tree.radius, variant: tree.variant, direction, scale: depthScale(tree.position.y, world.height), time: world.time },
  ]
  return { ok: true, propId, chargesLeft: charge.chargesLeft }
}
