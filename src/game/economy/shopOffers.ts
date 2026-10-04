import type { ToolKind } from '../toolTypes'
import type { World } from '../types'
import type { ShopItemId, ShopOffer } from './economyTypes'
import { isTierOpen, ownedCountOf, priceOf, purchaseBlocker } from './pricing'
import { shopEntries } from './shopCatalog'
import { affordProgress, tierUnlockProgress } from './shopGoals'

const toolItems = new Map<ToolKind, ShopItemId>(shopEntries.flatMap((entry) => (entry.grant.type === 'tool' ? [[entry.grant.tool, entry.id] as const] : [])))

export function toolShopItem(tool: ToolKind): ShopItemId | null {
  return toolItems.get(tool) ?? null
}

export function offerFor(world: World, itemId: ShopItemId): ShopOffer {
  return {
    itemId,
    price: priceOf(world, itemId),
    owned: ownedCountOf(world, itemId),
    blocker: purchaseBlocker(world, itemId),
    tierOpen: isTierOpen(world, itemId),
    tierProgress: tierUnlockProgress(world, itemId),
    affordProgress: affordProgress(world, itemId),
  }
}

export function offerSignature(offer: ShopOffer): string {
  return `${offer.itemId}:${offer.price}:${offer.owned}:${offer.blocker ?? ''}:${offer.tierProgress.toFixed(3)}:${offer.affordProgress.toFixed(3)}`
}
