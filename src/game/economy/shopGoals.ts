import type { World } from '../types'
import { tierThresholds } from './economyConstants'
import { economyOf } from './economyState'
import type { NextGoal, ShopCategory, ShopItemId, ShopTier, TierStanding } from './economyTypes'
import { isTierOpen, priceOf, purchaseBlocker, tierOf } from './pricing'
import { shopEntries } from './shopCatalog'

const goalCategories = new Set<ShopCategory>(['static', 'moving', 'water', 'tool', 'collar'])
const tierSteps: readonly ShopTier[] = [0, 1, 2, 3, 4]

export function tierStandingOf(lifetimeEarned: number): TierStanding {
  const tier = tierOf(lifetimeEarned)
  const nextTier = tierSteps.find((step) => step > tier) ?? null
  const floor = tierThresholds[tier]
  const ceiling = nextTier === null ? null : tierThresholds[nextTier]
  const progress = ceiling === null ? 1 : Math.min(1, Math.max(0, (lifetimeEarned - floor) / (ceiling - floor)))
  return { tier, nextTier, floor, ceiling, progress }
}

export function tierUnlockProgress(world: World, itemId: ShopItemId): number {
  const entry = shopEntries.find((candidate) => candidate.id === itemId)
  if (!entry) return 0
  const threshold = tierThresholds[entry.tier]
  return threshold <= 0 ? 1 : Math.min(1, economyOf(world).lifetimeEarned / threshold)
}

export function affordProgress(world: World, itemId: ShopItemId): number {
  const price = priceOf(world, itemId)
  return price <= 0 ? 1 : Math.min(1, economyOf(world).wallet / price)
}

export function nextGoalOf(world: World): NextGoal | null {
  let best: NextGoal | null = null
  for (const entry of shopEntries) {
    if (!goalCategories.has(entry.category) || !isTierOpen(world, entry.id)) continue
    if (purchaseBlocker(world, entry.id) !== 'insufficientFunds') continue
    const price = priceOf(world, entry.id)
    if (best && best.price <= price) continue
    best = { itemId: entry.id, price, progress: affordProgress(world, entry.id) }
  }
  return best
}
