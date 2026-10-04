import type { StepContext } from '../memory'
import { removeProp } from '../spawning'
import type { World } from '../types'
import { REFUND_GRACE_SECONDS, REFUND_RATE } from './economyConstants'
import { economyOf } from './economyState'
import type { RefundResult } from './economyTypes'
import { creditTokens, noteDenied } from './ledger'
import { shopEntryOf } from './shopCatalog'

const lockedPropKinds = new Set(['tree', 'feedingStation'])

function holdingValue(world: World, holdingId: string): number {
  const holding = economyOf(world).holdings[holdingId]
  if (!holding || !shopEntryOf(holding.itemId).refundable) return 0
  const paid = Math.max(0, Math.floor(holding.paid))
  const age = world.time - holding.placedAt
  return age >= 0 && age <= REFUND_GRACE_SECONDS ? paid : Math.floor(paid * REFUND_RATE)
}

export function refundValueOf(context: StepContext, holdingId: string): number {
  return holdingValue(context.world, holdingId)
}

export function isLockedProp(world: World, propId: string): boolean {
  const prop = world.props.find((candidate) => candidate.id === propId)
  return !prop || lockedPropKinds.has(prop.kind)
}

export function refundPreviewOf(world: World, propId: string): number | null {
  if (isLockedProp(world, propId)) return null
  return holdingValue(world, propId)
}

export function isInRefundGrace(world: World, propId: string): boolean {
  const holding = economyOf(world).holdings[propId]
  if (!holding) return false
  const age = world.time - holding.placedAt
  return age >= 0 && age <= REFUND_GRACE_SECONDS
}

export function refund(context: StepContext, holdingId: string): RefundResult {
  const { world } = context
  const economy = economyOf(world)
  const holding = economy.holdings[holdingId]
  if (!holding) return { ok: false, holdingId, reason: 'notOwned' }
  if (!shopEntryOf(holding.itemId).refundable) return { ok: false, holdingId, reason: 'notRefundable' }
  const amount = holdingValue(world, holdingId)
  const remaining = { ...economy.holdings }
  delete remaining[holdingId]
  economy.holdings = remaining
  const prop = world.props.find((candidate) => candidate.id === holdingId)
  const refunded = creditTokens(world, amount, 'refund', holding.itemId, prop ? prop.position : null)
  return { ok: true, holdingId, refunded, wallet: economy.wallet }
}

export function forfeitHolding(context: StepContext, holdingId: string): boolean {
  const economy = economyOf(context.world)
  if (!economy.holdings[holdingId]) return false
  const remaining = { ...economy.holdings }
  delete remaining[holdingId]
  economy.holdings = remaining
  return true
}

export function discardProp(context: StepContext, propId: string): RefundResult {
  const { world } = context
  const prop = world.props.find((candidate) => candidate.id === propId)
  if (!prop) return { ok: false, holdingId: propId, reason: 'notOwned' }
  if (lockedPropKinds.has(prop.kind)) {
    noteDenied(world, null, 'notRefundable', prop.position)
    return { ok: false, holdingId: propId, reason: 'notRefundable' }
  }
  const owned = economyOf(world).holdings[propId]
  const result: RefundResult = owned ? refund(context, propId) : { ok: true, holdingId: propId, refunded: 0, wallet: economyOf(world).wallet }
  if (!result.ok) return result
  removeProp(world, propId)
  return result
}
