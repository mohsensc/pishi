import {
  GRAVEL_TILES_PER_PACK,
  isPricedItem,
  isPricedTool,
  legacyToolPoints,
  priceOfItem,
  STONE_TILES_PER_PACK,
  toolPriceItems,
  TREE_CHARGES_PER_PACK,
  type PricedItemId,
  type PricedTool,
} from './shopPrices.ts'

export interface PaidHolding {
  itemId: string
  paid: number
}

export interface SpendSheet {
  holdings: readonly PaidHolding[]
  ownedTools: readonly string[]
  grantedTools: readonly string[]
  collarsBought: number
  grantedCollars: number
  treeChargesBought: number
  gravelBought: number
  stoneBought: number
}

export interface GrantSheet {
  tools: readonly string[]
  collars: number
}

function whole(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

function packsFor(units: number, perPack: number): number {
  return Math.ceil(whole(units) / perPack)
}

export function leastPaidFor(itemId: PricedItemId, count: number): number {
  let total = 0
  for (let owned = 0; owned < count; owned += 1) total += priceOfItem(itemId, owned)
  return total
}

export function underpaidItems(holdings: readonly PaidHolding[]): Set<string> {
  const groups = new Map<string, { count: number; paid: number }>()
  holdings.forEach((holding) => {
    const group = groups.get(holding.itemId) ?? { count: 0, paid: 0 }
    groups.set(holding.itemId, { count: group.count + 1, paid: group.paid + whole(holding.paid) })
  })
  const underpaid = new Set<string>()
  groups.forEach((group, itemId) => {
    if (!isPricedItem(itemId) || group.paid < leastPaidFor(itemId, group.count)) underpaid.add(itemId)
  })
  return underpaid
}

export function boughtToolsCost(ownedTools: readonly string[], grantedTools: readonly string[]): number {
  const granted = new Set(grantedTools)
  return [...new Set(ownedTools)].filter((tool): tool is PricedTool => isPricedTool(tool) && !granted.has(tool)).reduce((sum, tool) => sum + priceOfItem(toolPriceItems[tool], 0), 0)
}

export function boughtCollarsCost(collarsBought: number, grantedCollars: number): number {
  let total = 0
  for (let owned = Math.min(whole(grantedCollars), whole(collarsBought)); owned < whole(collarsBought); owned += 1) total += priceOfItem('collar', owned)
  return total
}

export function committedSpendOf(sheet: SpendSheet): number {
  const holdingsPaid = sheet.holdings.reduce((sum, holding) => sum + whole(holding.paid), 0)
  return (
    holdingsPaid +
    boughtToolsCost(sheet.ownedTools, sheet.grantedTools) +
    boughtCollarsCost(sheet.collarsBought, sheet.grantedCollars) +
    packsFor(sheet.treeChargesBought, TREE_CHARGES_PER_PACK) * priceOfItem('treeCharges', 0) +
    packsFor(sheet.gravelBought, GRAVEL_TILES_PER_PACK) * priceOfItem('pathGravel', 0) +
    packsFor(sheet.stoneBought, STONE_TILES_PER_PACK) * priceOfItem('pathStone', 0)
  )
}

export function legacyToolsFor(points: number): PricedTool[] {
  return (Object.keys(legacyToolPoints) as PricedTool[]).filter((tool) => whole(points) >= legacyToolPoints[tool])
}

export function grantsWithin(next: GrantSheet, ceiling: GrantSheet): boolean {
  const allowed = new Set(ceiling.tools)
  return next.tools.every((tool) => allowed.has(tool)) && whole(next.collars) <= whole(ceiling.collars)
}
