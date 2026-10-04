import { settleOnGround } from '../ai/helpers/queries'
import { clampToBounds } from '../bounds'
import { GRAVITY } from '../constants'
import type { StepContext } from '../memory'
import { add, isFiniteVec, scale } from '../vector'
import type { TreatState } from '../types'
import { TREAT_EATEN_LINGER } from './toolConstants'

function stepTreat(treat: TreatState, context: StepContext): void {
  const { dt } = context
  if (treat.eatenAt !== null) return
  if (treat.height > 0 || treat.verticalSpeed > 0) {
    treat.verticalSpeed -= GRAVITY * dt
    treat.height += treat.verticalSpeed * dt
    if (treat.height <= 0) {
      treat.height = 0
      treat.verticalSpeed = Math.abs(treat.verticalSpeed) > 120 ? -treat.verticalSpeed * 0.32 : 0
      treat.velocity = scale(treat.velocity, 0.6)
    }
  }
  const grounded = treat.height <= 0.5
  treat.velocity = scale(treat.velocity, Math.exp(-(grounded ? 5 : 0.4) * dt))
  treat.position = clampToBounds(add(treat.position, scale(treat.velocity, dt)), context.bounds)
  if (grounded) treat.position = settleOnGround(treat.position, context, 4)
  if (!isFiniteVec(treat.position) || !Number.isFinite(treat.height)) {
    treat.position = clampToBounds({ x: 0, y: 0 }, context.bounds)
    treat.height = 0
    treat.verticalSpeed = 0
    treat.velocity = { x: 0, y: 0 }
  }
}

export function updateTreats(context: StepContext): void {
  const { world } = context
  world.treats.forEach((treat) => {
    if (treat.claimedByCatId && !world.cats.some((cat) => cat.id === treat.claimedByCatId && cat.behavior === 'eatDroppedTreat')) treat.claimedByCatId = null
    stepTreat(treat, context)
  })
  world.treats = world.treats.filter((treat) => treat.eatenAt === null || world.time - treat.eatenAt < TREAT_EATEN_LINGER)
}

export function updateCatnip(context: StepContext, lifetime: number): void {
  const { world } = context
  world.catnip = world.catnip.filter((patch) => world.time - patch.createdAt < lifetime)
  world.catnip.forEach((patch) => {
    patch.potency = Math.max(0, 1 - (world.time - patch.createdAt) / lifetime)
  })
}
