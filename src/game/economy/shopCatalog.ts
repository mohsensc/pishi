import { shopPriceRules, type PriceRule } from '../../../shared/shopPrices'
import { GRAVEL_TILES_PER_PACK, STONE_TILES_PER_PACK, TREE_CHARGES_PER_PACK } from './economyConstants'
import type { ShopCategory, ShopEntry, ShopGrant, ShopItemId, ShopTier } from './economyTypes'

const priceRules: Record<ShopItemId, PriceRule> = shopPriceRules

function entry(id: ShopItemId, category: ShopCategory, tier: ShopTier, grant: ShopGrant, options: Partial<Pick<ShopEntry, 'maxOwned' | 'refundable'>> = {}): ShopEntry {
  return {
    id,
    category,
    price: priceRules[id].price,
    tier,
    grant,
    priceStep: priceRules[id].step,
    maxOwned: options.maxOwned ?? null,
    refundable: options.refundable ?? grant.type === 'prop',
  }
}

export const shopEntries: readonly ShopEntry[] = [
  entry('cushion', 'static', 0, { type: 'prop', kind: 'cushion' }, { maxOwned: 6 }),
  entry('rock', 'static', 0, { type: 'prop', kind: 'rock' }, { maxOwned: 6 }),
  entry('cardboardBox', 'static', 0, { type: 'prop', kind: 'cardboardBox' }, { maxOwned: 6 }),
  entry('flowerBed', 'static', 0, { type: 'prop', kind: 'flowerBed' }, { maxOwned: 6 }),
  entry('foodBowl', 'static', 1, { type: 'prop', kind: 'foodBowl' }, { maxOwned: 4 }),
  entry('yarnBasket', 'static', 1, { type: 'prop', kind: 'yarnBasket' }, { maxOwned: 3 }),
  entry('scratchingPost', 'static', 1, { type: 'prop', kind: 'scratchingPost' }, { maxOwned: 4 }),
  entry('sapling', 'static', 1, { type: 'prop', kind: 'tree' }, { maxOwned: 12 }),
  entry('bush', 'static', 1, { type: 'prop', kind: 'bush' }, { maxOwned: 8 }),
  entry('picnicBlanket', 'static', 1, { type: 'prop', kind: 'picnicBlanket' }, { maxOwned: 2 }),
  entry('bench', 'static', 2, { type: 'prop', kind: 'bench' }, { maxOwned: 4 }),
  entry('lamppost', 'static', 2, { type: 'prop', kind: 'lamppost' }, { maxOwned: 4 }),
  entry('tunnel', 'static', 2, { type: 'prop', kind: 'tunnel' }, { maxOwned: 3 }),
  entry('catTree', 'static', 3, { type: 'prop', kind: 'catTree' }, { maxOwned: 3 }),
  entry('birdbath', 'water', 1, { type: 'prop', kind: 'birdbath' }, { maxOwned: 3 }),
  entry('pond', 'water', 3, { type: 'prop', kind: 'pond' }, { maxOwned: 2 }),
  entry('fountain', 'water', 3, { type: 'prop', kind: 'fountain' }, { maxOwned: 2 }),
  entry('pinwheel', 'moving', 0, { type: 'prop', kind: 'pinwheel' }, { maxOwned: 6 }),
  entry('springToy', 'moving', 1, { type: 'prop', kind: 'springToy' }, { maxOwned: 4 }),
  entry('birdFeeder', 'moving', 2, { type: 'prop', kind: 'birdFeeder' }, { maxOwned: 3 }),
  entry('swing', 'moving', 2, { type: 'prop', kind: 'swing' }, { maxOwned: 2 }),
  entry('butterflyHouse', 'moving', 2, { type: 'prop', kind: 'butterflyHouse' }, { maxOwned: 2 }),
  entry('sprinkler', 'moving', 3, { type: 'prop', kind: 'sprinkler' }, { maxOwned: 2 }),
  entry('windmill', 'moving', 3, { type: 'prop', kind: 'windmill' }, { maxOwned: 2 }),
  entry('bubbleMachine', 'moving', 4, { type: 'prop', kind: 'bubbleMachine' }, { maxOwned: 2 }),
  entry('toyMouse', 'toy', 0, { type: 'toy', kind: 'mouse' }),
  entry('toolTreat', 'tool', 0, { type: 'tool', tool: 'treat' }, { maxOwned: 1 }),
  entry('toolBrush', 'tool', 1, { type: 'tool', tool: 'brush' }, { maxOwned: 1 }),
  entry('toolWand', 'tool', 2, { type: 'tool', tool: 'wand' }, { maxOwned: 1 }),
  entry('toolLaser', 'tool', 3, { type: 'tool', tool: 'laser' }, { maxOwned: 1 }),
  entry('toolCatnip', 'tool', 4, { type: 'tool', tool: 'catnip' }, { maxOwned: 1 }),
  entry('careFish', 'care', 0, { type: 'care', kind: 'fish' }),
  entry('careMilk', 'care', 0, { type: 'care', kind: 'milk' }),
  entry('careYarn', 'care', 1, { type: 'care', kind: 'yarn' }),
  entry('careBrush', 'care', 1, { type: 'care', kind: 'brush' }),
  entry('careTreat', 'care', 2, { type: 'care', kind: 'treat' }),
  entry('collar', 'collar', 3, { type: 'collar' }),
  entry('treeCharges', 'clearing', 0, { type: 'treeCharges', charges: TREE_CHARGES_PER_PACK }),
  entry('pathGravel', 'path', 0, { type: 'pathTiles', style: 'gravel', tiles: GRAVEL_TILES_PER_PACK }),
  entry('pathStone', 'path', 2, { type: 'pathTiles', style: 'stone', tiles: STONE_TILES_PER_PACK }),
]

const entriesById = new Map<ShopItemId, ShopEntry>(shopEntries.map((item) => [item.id, item]))

export const shopItemIds: readonly ShopItemId[] = shopEntries.map((item) => item.id)

export function shopEntryOf(id: ShopItemId): ShopEntry {
  const found = entriesById.get(id)
  if (!found) throw new Error(`unknown shop item ${id}`)
  return found
}

export function findShopEntry(id: unknown): ShopEntry | null {
  return typeof id === 'string' ? (entriesById.get(id as ShopItemId) ?? null) : null
}

export function shopEntriesIn(category: ShopCategory): ShopEntry[] {
  return shopEntries.filter((item) => item.category === category)
}

export function shopItemForProp(kind: string): ShopEntry | null {
  return shopEntries.find((item) => item.grant.type === 'prop' && item.grant.kind === kind) ?? null
}
