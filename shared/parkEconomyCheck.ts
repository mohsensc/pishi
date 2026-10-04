import {
  LIFETIME_MAX,
  MAX_COLLARS_BOUGHT,
  MAX_EARN_PER_SECOND,
  MAX_EARN_WINDOW_SECONDS,
  MAX_PURCHASED_PROPS,
  MAX_TREES,
  MIGRATION_GRANT_MAX,
  PATH_CELL_COUNT,
  WALLET_MAX,
} from './parkLimits.ts'
import { committedSpendOf, grantsWithin, legacyToolsFor, underpaidItems, type GrantSheet, type PaidHolding, type SpendSheet } from './parkSpendCheck.ts'

export type EconomyProblem = 'economy' | 'wallet' | 'lifetime' | 'ledger' | 'holdings' | 'committed' | 'props' | 'paths' | 'growth' | 'future' | 'sunk' | 'grants'

export interface EconomyMark {
  lifetimeEarned: number
  sunk: number
  grants: GrantSheet
}

export interface PreviousPark {
  economy: EconomyMark | null
  legacyGrants: GrantSheet
  since: number
}

export const EARN_GROWTH_SLACK = 60
export const FIRST_SAVE_EARN_MAX = EARN_GROWTH_SLACK + MIGRATION_GRANT_MAX
export const FUTURE_SKEW_MS = 5 * 60 * 1000

const noGrants: GrantSheet = { tools: [], collars: 0 }

type Parsed<T> = { ok: true; value: T } | { ok: false; problem: EconomyProblem }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWholeIn(value: unknown, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= maximum
}

function wholeOr(value: unknown, maximum: number, fallback: number): number | null {
  if (value === undefined) return fallback
  return isWholeIn(value, maximum) ? value : null
}

function stringsOf(raw: unknown): string[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw) || !raw.every((entry) => typeof entry === 'string')) return null
  return raw
}

function holdingsOf(raw: unknown): PaidHolding[] | null {
  if (raw === undefined) return []
  if (!Array.isArray(raw)) return null
  const holdings: PaidHolding[] = []
  for (const holding of raw) {
    if (!isRecord(holding) || typeof holding.itemId !== 'string' || !isWholeIn(holding.paid, LIFETIME_MAX)) return null
    holdings.push({ itemId: holding.itemId, paid: holding.paid })
  }
  return holdings
}

function spendSheetOf(economy: Record<string, unknown>): Parsed<SpendSheet> {
  const holdings = holdingsOf(economy.holdings)
  if (!holdings || underpaidItems(holdings).size > 0) return { ok: false, problem: 'holdings' }
  const ownedTools = stringsOf(economy.ownedTools)
  const grantedTools = stringsOf(economy.grantedTools)
  const collarsBought = wholeOr(economy.collarsBought, MAX_COLLARS_BOUGHT, 0)
  const grantedCollars = wholeOr(economy.grantedCollars, MAX_COLLARS_BOUGHT, 0)
  const treeChargesBought = wholeOr(economy.treeChargesBought, LIFETIME_MAX, 0)
  const pathBought = isRecord(economy.pathBought) ? economy.pathBought : {}
  const gravelBought = wholeOr(pathBought.gravel, LIFETIME_MAX, 0)
  const stoneBought = wholeOr(pathBought.stone, LIFETIME_MAX, 0)
  if (!ownedTools || !grantedTools || collarsBought === null || grantedCollars === null || treeChargesBought === null || gravelBought === null || stoneBought === null) {
    return { ok: false, problem: 'economy' }
  }
  return { ok: true, value: { holdings, ownedTools, grantedTools, collarsBought, grantedCollars, treeChargesBought, gravelBought, stoneBought } }
}

export function readEconomyMark(sections: unknown): Parsed<EconomyMark> {
  if (!isRecord(sections) || !isRecord(sections.economy)) return { ok: false, problem: 'economy' }
  const economy = sections.economy
  if (!isWholeIn(economy.wallet, WALLET_MAX)) return { ok: false, problem: 'wallet' }
  const { lifetimeEarned, lifetimeSpent, lifetimeRefunded } = economy
  if (!isWholeIn(lifetimeEarned, LIFETIME_MAX) || !isWholeIn(lifetimeSpent, LIFETIME_MAX) || !isWholeIn(lifetimeRefunded, LIFETIME_MAX)) return { ok: false, problem: 'lifetime' }
  if (lifetimeRefunded > lifetimeSpent || economy.wallet > lifetimeEarned - lifetimeSpent + lifetimeRefunded) return { ok: false, problem: 'ledger' }
  const sheet = spendSheetOf(economy)
  if (!sheet.ok) return sheet
  const netSpent = lifetimeSpent - lifetimeRefunded
  const committed = committedSpendOf(sheet.value)
  if (committed > netSpent) return { ok: false, problem: 'committed' }
  return { ok: true, value: { lifetimeEarned, sunk: netSpent - committed, grants: { tools: sheet.value.grantedTools, collars: sheet.value.grantedCollars } } }
}

export function findEconomyProblem(sections: unknown): EconomyProblem | null {
  const mark = readEconomyMark(sections)
  if (!mark.ok) return mark.problem
  const parkSections = sections as Record<string, unknown>
  if (Array.isArray(parkSections.props) && parkSections.props.length > MAX_PURCHASED_PROPS + MAX_TREES + 1) return 'props'
  const landscape = parkSections.landscape
  if (isRecord(landscape) && landscape.pathCells !== undefined && (typeof landscape.pathCells !== 'string' || landscape.pathCells.length !== PATH_CELL_COUNT)) return 'paths'
  return null
}

function legacyPointsOf(world: Record<string, unknown>): number {
  const progress = isRecord(world.progress) ? world.progress : {}
  if (isWholeIn(progress.points, LIFETIME_MAX)) return progress.points
  return isWholeIn(world.poppedCount, LIFETIME_MAX) ? world.poppedCount : 0
}

export function legacyGrantsOf(sections: unknown): GrantSheet {
  if (!isRecord(sections)) return noGrants
  const world = isRecord(sections.world) ? sections.world : {}
  const progress = isRecord(world.progress) ? world.progress : {}
  const cats = Array.isArray(sections.cats) ? sections.cats : []
  const collared = cats.filter((cat) => isRecord(cat) && isRecord(cat.collar)).length
  const inHand = isWholeIn(progress.collars, MAX_COLLARS_BOUGHT) ? progress.collars : 0
  return { tools: legacyToolsFor(legacyPointsOf(world)), collars: collared + inHand }
}

export function previousParkOf(sections: unknown, receivedAt: unknown, updatedAt: number, now: number): PreviousPark {
  const mark = readEconomyMark(sections)
  const trusted = typeof receivedAt === 'number' && Number.isFinite(receivedAt) ? receivedAt : updatedAt
  const legacy = !isRecord(sections) || sections.economy === undefined
  return {
    economy: mark.ok ? mark.value : legacy ? null : { lifetimeEarned: 0, sunk: 0, grants: noGrants },
    legacyGrants: legacy ? legacyGrantsOf(sections) : noGrants,
    since: Math.min(trusted, now),
  }
}

export function maxEarnedSince(previous: PreviousPark, now: number): number {
  const elapsedSeconds = Math.min(MAX_EARN_WINDOW_SECONDS, Math.max(0, now - previous.since) / 1000)
  const base = previous.economy?.lifetimeEarned ?? 0
  return base + MAX_EARN_PER_SECOND * elapsedSeconds + EARN_GROWTH_SLACK + (previous.economy ? 0 : MIGRATION_GRANT_MAX)
}

export function findHistoryProblem(previous: PreviousPark | null, next: EconomyMark, updatedAt: number, now: number): EconomyProblem | null {
  if (updatedAt > now + FUTURE_SKEW_MS) return 'future'
  if (!previous) {
    if (next.lifetimeEarned > FIRST_SAVE_EARN_MAX) return 'growth'
    return grantsWithin(next.grants, noGrants) ? null : 'grants'
  }
  if (next.lifetimeEarned > maxEarnedSince(previous, now)) return 'growth'
  if (!grantsWithin(next.grants, previous.economy ? previous.economy.grants : previous.legacyGrants)) return 'grants'
  if (previous.economy && next.sunk < previous.economy.sunk) return 'sunk'
  return null
}
