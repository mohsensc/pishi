import type { Vec, World } from '../types'
import { LIFETIME_MAX, RECENT_LEDGER_LENGTH, WALLET_MAX } from './economyConstants'
import { economyOf } from './economyState'
import type { DenyReason, EconomyState, LedgerReason, ShopItemId } from './economyTypes'

type CreditReason = Exclude<LedgerReason, 'purchase'>

function nextId(economy: EconomyState, prefix: string): string {
  economy.serial += 1
  return `${prefix}-${economy.serial}`
}

function copyPoint(position: Vec | null): Vec | null {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y) ? { x: position.x, y: position.y } : null
}

function record(world: World, reason: LedgerReason, amount: number, itemId: ShopItemId | null): void {
  const economy = economyOf(world)
  const entry = { id: nextId(economy, 'ledger'), reason, amount, itemId, time: world.time }
  economy.recent = [...economy.recent, entry].slice(-RECENT_LEDGER_LENGTH)
}

function creditRoom(economy: EconomyState, reason: CreditReason): number {
  const walletRoom = WALLET_MAX - economy.wallet
  if (reason === 'refund') return Math.min(walletRoom, economy.lifetimeSpent - economy.lifetimeRefunded)
  return Math.min(walletRoom, LIFETIME_MAX - economy.lifetimeEarned)
}

export function creditTokens(world: World, amount: number, reason: CreditReason, itemId: ShopItemId | null, position: Vec | null): number {
  const economy = economyOf(world)
  const whole = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0
  const credited = Math.min(whole, creditRoom(economy, reason))
  if (credited <= 0) return 0
  economy.wallet += credited
  if (reason === 'refund') economy.lifetimeRefunded += credited
  else economy.lifetimeEarned += credited
  economy.lastMint = { id: nextId(economy, 'mint'), reason, amount: credited, itemId, position: copyPoint(position), time: world.time }
  record(world, reason, credited, itemId)
  return credited
}

export function debitTokens(world: World, amount: number, itemId: ShopItemId, position: Vec | null): boolean {
  const economy = economyOf(world)
  const whole = Math.max(0, Math.ceil(amount))
  if (!Number.isFinite(whole) || whole > economy.wallet || economy.lifetimeSpent + whole > LIFETIME_MAX) return false
  economy.wallet -= whole
  economy.lifetimeSpent += whole
  economy.lastSpend = { id: nextId(economy, 'spend'), reason: 'purchase', amount: whole, itemId, position: copyPoint(position), time: world.time }
  record(world, 'purchase', -whole, itemId)
  return true
}

export function noteDenied(world: World, itemId: ShopItemId | null, reason: DenyReason, position: Vec | null = null): void {
  const economy = economyOf(world)
  economy.lastDenied = { id: nextId(economy, 'denied'), itemId, reason, position: copyPoint(position), time: world.time }
}
