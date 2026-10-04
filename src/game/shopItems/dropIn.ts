import { propMotionOf } from '../dragging/handlingMemory'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { PropKind } from '../types'
import { shopItemMemoryOf } from './shopItemMemory'

const dropHeight = 120
const dropStartSpeed = -80
const plantedKinds = new Set<PropKind>(['tree', 'pond'])

export function startDropIn(context: StepContext, propId: string): void {
  const { world } = context
  const prop = world.props.find((candidate) => candidate.id === propId)
  if (!prop) return
  if (plantedKinds.has(prop.kind)) {
    spawnEffect(world, prop.kind === 'pond' ? 'splash' : 'leaves', prop.position, prop.kind === 'pond' ? 0 : 30, prop.id, 1)
    spawnEffect(world, 'sparkle', prop.position, 20, prop.id, 0.8)
    spawnEffect(world, 'bounce', prop.position, 0, prop.id, 1.2)
    return
  }
  prop.lift = dropHeight * Math.max(0.75, context.memory.sizeScale)
  prop.droppedAt = null
  const motion = propMotionOf(world, propId)
  motion.landed = false
  motion.carried = false
  motion.liftSpeed = dropStartSpeed
  motion.tiltSpeed = context.memory.random.range(-30, 30)
  motion.velocity = { x: 0, y: 0 }
  motion.settleTarget = { ...prop.position }
  shopItemMemoryOf(world).dropping.add(propId)
}
