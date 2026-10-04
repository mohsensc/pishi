import { priceAt } from '../../../shared/shopPrices'
import { COLLAR_CAPACITY } from '../progress/progressCatalog'
import { progressOf } from '../progress/progress'
import type { World } from '../types'
import { MAX_PURCHASED_PROPS, MAX_TREES, tierThresholds } from './economyConstants'
import { economyOf } from './economyState'
import type { DenyReason, ShopItemId, ShopTier } from './economyTypes'
import { shopEntryOf } from './shopCatalog'

const tiers: readonly ShopTier[] = [4, 3, 2, 1, 0]

export function tierOf(lifetimeEarned: number): ShopTier {
  return tiers.find((tier) => lifetimeEarned >= tierThresholds[tier]) ?? 0
}

export function tierProgress(lifetimeEarned: number, tier: ShopTier): number {
  const threshold = tierThresholds[tier]
  return threshold <= 0 ? 1 : Math.min(1, Math.max(0, lifetimeEarned / threshold))
}

export function ownedCountOf(world: World, itemId: ShopItemId): number {
  const entry = shopEntryOf(itemId)
  const economy = economyOf(world)
  if (entry.grant.type === 'tool') return economy.ownedTools.includes(entry.grant.tool) ? 1 : 0
  if (entry.grant.type === 'collar') return economy.collarsBought
  return Object.values(economy.holdings).filter((holding) => holding.itemId === itemId).length
}

export function priceOf(world: World, itemId: ShopItemId): number {
  const entry = shopEntryOf(itemId)
  return priceAt({ price: entry.price, step: entry.priceStep }, ownedCountOf(world, itemId))
}

export function isTierOpen(world: World, itemId: ShopItemId): boolean {
  return economyOf(world).lifetimeEarned >= tierThresholds[shopEntryOf(itemId).tier]
}

export function purchasedPropCount(world: World): number {
  return world.props.filter((prop) => prop.kind !== 'tree' && prop.kind !== 'feedingStation').length
}

function collarRoom(world: World): boolean {
  const collared = world.cats.filter((cat) => cat.collar).length
  const inHand = progressOf(world).collars
  return inHand < COLLAR_CAPACITY && collared + inHand < world.cats.length
}

function capBlocker(world: World, itemId: ShopItemId): DenyReason | null {
  const entry = shopEntryOf(itemId)
  const { grant } = entry
  if (grant.type === 'tool' && economyOf(world).ownedTools.includes(grant.tool)) return 'alreadyOwned'
  if (grant.type === 'collar' && !collarRoom(world)) return 'capReached'
  if (entry.maxOwned !== null && ownedCountOf(world, itemId) >= entry.maxOwned) return 'capReached'
  if (grant.type === 'prop' && grant.kind === 'tree' && world.props.filter((prop) => prop.kind === 'tree').length >= MAX_TREES) return 'capReached'
  if (grant.type === 'prop' && grant.kind !== 'tree' && purchasedPropCount(world) >= MAX_PURCHASED_PROPS) return 'capReached'
  return null
}

export function purchaseBlocker(world: World, itemId: ShopItemId): DenyReason | null {
  if (!isTierOpen(world, itemId)) return 'tierLocked'
  const cap = capBlocker(world, itemId)
  if (cap) return cap
  return priceOf(world, itemId) > economyOf(world).wallet ? 'insufficientFunds' : null
}

export function canAfford(world: World, itemId: ShopItemId): boolean {
  return purchaseBlocker(world, itemId) === null
}
