import { createEconomyState } from '../../economy/economyState'
import { LIFETIME_MAX, MAX_COLLARS_BOUGHT, WALLET_MAX } from '../../economy/economyConstants'
import { findShopEntry, shopEntries } from '../../economy/shopCatalog'
import type { EconomyState, Holding } from '../../economy/economyTypes'
import type { ToolKind } from '../../toolTypes'
import { captureFields, isRecord, readCount, readId, readIntegerIn, readList, readOneOf, restoreFields, type FieldReaders } from '../fieldReaders'
import type { ParkSection } from '../parkSaveTypes'

const maxHoldings = 128
const restoredHoldingAge = 3600
const toolKinds: readonly ToolKind[] = ['hand', ...shopEntries.flatMap((entry) => (entry.grant.type === 'tool' ? [entry.grant.tool] : []))]
const readTool = readOneOf(toolKinds)
const readStock = readIntegerIn(0, 1_000_000)

export const economyFields: FieldReaders<EconomyState> = {
  wallet: readIntegerIn(0, WALLET_MAX),
  lifetimeEarned: readIntegerIn(0, LIFETIME_MAX),
  lifetimeSpent: readIntegerIn(0, LIFETIME_MAX),
  lifetimeRefunded: readIntegerIn(0, LIFETIME_MAX),
  collarsBought: readIntegerIn(0, MAX_COLLARS_BOUGHT),
  grantedCollars: readIntegerIn(0, MAX_COLLARS_BOUGHT),
  treeCharges: readStock,
  treeChargesBought: readStock,
  treesCleared: readStock,
  serial: readCount,
}

function captureHoldings(holdings: Record<string, Holding>): unknown[] {
  return Object.entries(holdings).map(([id, holding]) => ({ id, itemId: holding.itemId, paid: holding.paid }))
}

function restoreHoldings(raw: unknown, now: number): Record<string, Holding> {
  const holdings: Record<string, Holding> = {}
  readList(raw, maxHoldings).forEach((entry) => {
    if (!isRecord(entry)) return
    const id = readId(entry.id)
    const shopEntry = findShopEntry(entry.itemId)
    const paid = readIntegerIn(0, LIFETIME_MAX)(entry.paid)
    if (!id || !shopEntry || shopEntry.grant.type !== 'prop' || paid === undefined || holdings[id]) return
    holdings[id] = { itemId: shopEntry.id, paid, placedAt: now - restoredHoldingAge }
  })
  return holdings
}

function restoreStock(raw: unknown): EconomyState['pathStock'] {
  const record = isRecord(raw) ? raw : {}
  return { gravel: readStock(record.gravel) ?? 0, stone: readStock(record.stone) ?? 0 }
}

export const economySection: ParkSection = {
  key: 'economy',
  capture: (world) => ({
    ...captureFields(world.economy, economyFields),
    holdings: captureHoldings(world.economy.holdings),
    ownedTools: world.economy.ownedTools,
    grantedTools: world.economy.grantedTools,
    pathStock: world.economy.pathStock,
    pathBought: world.economy.pathBought,
  }),
  restore: (raw, { world }) => {
    const economy = restoreFields(createEconomyState(), raw, economyFields)
    const record = isRecord(raw) ? raw : {}
    const tools = readList(record.ownedTools, toolKinds.length).flatMap((tool) => readTool(tool) ?? [])
    const grantedTools = readList(record.grantedTools, toolKinds.length).flatMap((tool) => readTool(tool) ?? [])
    world.economy = {
      ...economy,
      holdings: restoreHoldings(record.holdings, world.time),
      ownedTools: [...new Set(['hand' as const, ...tools])],
      grantedTools: [...new Set(grantedTools.filter((tool) => tool !== 'hand'))],
      pathStock: restoreStock(record.pathStock),
      pathBought: restoreStock(record.pathBought),
    }
  },
}
