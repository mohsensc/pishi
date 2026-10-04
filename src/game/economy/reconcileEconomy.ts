import { committedSpendOf, underpaidItems } from '../../../shared/parkSpendCheck'
import { createFreshParkProps } from '../landscape/freshPark'
import { pathStyleCodes, pathStyles } from '../landscape/pathGrid'
import { COLLAR_CAPACITY } from '../progress/progressCatalog'
import { progressOf } from '../progress/progress'
import type { ToolKind } from '../toolTypes'
import type { World } from '../types'
import { LIFETIME_MAX, MAX_COLLARS_BOUGHT, MAX_PURCHASED_PROPS, MAX_TREES, WALLET_MAX } from './economyConstants'
import { economyOf } from './economyState'
import type { EconomyState, Holding } from './economyTypes'
import { shopEntries, shopEntryOf } from './shopCatalog'

const shopTools = new Set<ToolKind>(shopEntries.flatMap((entry) => (entry.grant.type === 'tool' ? [entry.grant.tool] : [])))

function wholeIn(value: number, maximum: number): number {
  return Number.isFinite(value) ? Math.min(maximum, Math.max(0, Math.floor(value))) : 0
}

function settleLedger(economy: EconomyState): void {
  economy.lifetimeEarned = wholeIn(economy.lifetimeEarned, LIFETIME_MAX)
  economy.lifetimeSpent = wholeIn(economy.lifetimeSpent, LIFETIME_MAX)
  economy.lifetimeRefunded = Math.min(wholeIn(economy.lifetimeRefunded, LIFETIME_MAX), economy.lifetimeSpent)
  if (economy.lifetimeSpent > economy.lifetimeEarned + economy.lifetimeRefunded) economy.lifetimeSpent = economy.lifetimeEarned + economy.lifetimeRefunded
  const ceiling = economy.lifetimeEarned - economy.lifetimeSpent + economy.lifetimeRefunded
  economy.wallet = Math.min(wholeIn(economy.wallet, WALLET_MAX), ceiling)
}

function holdingMatchesProp(holding: Holding, kind: string): boolean {
  const { grant } = shopEntryOf(holding.itemId)
  return grant.type === 'prop' && grant.kind === kind
}

function netSpentOf(economy: EconomyState): number {
  return economy.lifetimeSpent - economy.lifetimeRefunded
}

function settleHoldings(world: World, economy: EconomyState): void {
  const kinds = new Map(world.props.map((prop) => [prop.id, prop.kind as string]))
  const matched = Object.entries(economy.holdings).flatMap(([propId, holding]): [string, Holding][] => {
    const kind = kinds.get(propId)
    return kind !== undefined && holdingMatchesProp(holding, kind) ? [[propId, { ...holding, paid: wholeIn(holding.paid, LIFETIME_MAX) }]] : []
  })
  const underpaid = underpaidItems(matched.map(([, holding]) => holding))
  const kept = matched.filter(([, holding]) => !underpaid.has(holding.itemId))
  const paidTotal = kept.reduce((sum, [, holding]) => sum + holding.paid, 0)
  economy.holdings = paidTotal <= netSpentOf(economy) ? Object.fromEntries(kept) : {}
}

function settleProps(world: World, economy: EconomyState): void {
  let trees = 0
  let bought = 0
  world.props = world.props.filter((prop) => {
    if (prop.kind === 'feedingStation') return true
    if (prop.kind === 'tree') {
      trees += 1
      return trees <= MAX_TREES
    }
    if (!economy.holdings[prop.id]) return false
    bought += 1
    return bought <= MAX_PURCHASED_PROPS
  })
  if (!world.props.some((prop) => prop.kind === 'feedingStation')) {
    const station = createFreshParkProps(world.width, world.height, 0).find((prop) => prop.kind === 'feedingStation')
    if (station) world.props = [...world.props, station]
  }
  const live = new Set(world.props.map((prop) => prop.id))
  economy.holdings = Object.fromEntries(Object.entries(economy.holdings).filter(([propId]) => live.has(propId)))
}

function settleCounters(economy: EconomyState): void {
  economy.treeChargesBought = wholeIn(economy.treeChargesBought, LIFETIME_MAX)
  economy.treesCleared = Math.min(wholeIn(economy.treesCleared, LIFETIME_MAX), economy.treeChargesBought)
  economy.treeCharges = Math.min(wholeIn(economy.treeCharges, LIFETIME_MAX), economy.treeChargesBought - economy.treesCleared)
  economy.ownedTools = ['hand', ...new Set(economy.ownedTools.filter((tool) => shopTools.has(tool)))]
  economy.grantedTools = [...new Set(economy.grantedTools.filter((tool) => economy.ownedTools.includes(tool) && shopTools.has(tool)))]
  economy.collarsBought = wholeIn(economy.collarsBought, MAX_COLLARS_BOUGHT)
  economy.grantedCollars = Math.min(wholeIn(economy.grantedCollars, MAX_COLLARS_BOUGHT), economy.collarsBought)
}

function committedOf(economy: EconomyState): number {
  return committedSpendOf({
    holdings: Object.values(economy.holdings),
    ownedTools: economy.ownedTools,
    grantedTools: economy.grantedTools,
    collarsBought: economy.collarsBought,
    grantedCollars: economy.grantedCollars,
    treeChargesBought: economy.treeChargesBought,
    gravelBought: wholeIn(economy.pathBought.gravel, LIFETIME_MAX),
    stoneBought: wholeIn(economy.pathBought.stone, LIFETIME_MAX),
  })
}

function settleCommitments(economy: EconomyState): void {
  if (committedOf(economy) <= netSpentOf(economy)) return
  economy.ownedTools = ['hand', ...economy.grantedTools]
  economy.collarsBought = economy.grantedCollars
  economy.treeChargesBought = 0
  economy.treesCleared = 0
  economy.treeCharges = 0
  economy.pathBought = { gravel: 0, stone: 0 }
  economy.pathStock = { gravel: 0, stone: 0 }
  if (committedOf(economy) > netSpentOf(economy)) economy.holdings = {}
}

function settleCollars(world: World, economy: EconomyState): void {
  const progress = progressOf(world)
  progress.collars = Math.min(wholeIn(progress.collars, COLLAR_CAPACITY), economy.collarsBought)
  const allowedOnCats = economy.collarsBought - progress.collars
  const collared = world.cats.filter((cat) => cat.collar).sort((first, second) => (first.collar?.fittedAt ?? 0) - (second.collar?.fittedAt ?? 0))
  collared.slice(allowedOnCats).forEach((cat) => {
    cat.collar = null
  })
}

function trimPathCells(world: World, economy: EconomyState): void {
  const cells = [...world.landscape.pathCells]
  pathStyles.forEach((style) => {
    const code = pathStyleCodes[style]
    const bought = wholeIn(economy.pathBought[style], LIFETIME_MAX)
    let placed = 0
    cells.forEach((cell, index) => {
      if (cell !== code) return
      placed += 1
      if (placed > bought) cells[index] = 0
    })
    const kept = Math.min(placed, bought)
    economy.pathBought = { ...economy.pathBought, [style]: bought }
    economy.pathStock = { ...economy.pathStock, [style]: Math.min(wholeIn(economy.pathStock[style], LIFETIME_MAX), bought - kept) }
  })
  world.landscape.pathCells = cells
}

export function reconcileEconomy(world: World): void {
  const economy = economyOf(world)
  settleLedger(economy)
  settleHoldings(world, economy)
  settleCounters(economy)
  settleCommitments(economy)
  settleProps(world, economy)
  settleCollars(world, economy)
  trimPathCells(world, economy)
}
