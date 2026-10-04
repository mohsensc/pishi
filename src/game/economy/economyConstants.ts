import type { CatchKind } from '../care/careTypes'
import type { ShopTier } from './economyTypes'

export { LIFETIME_MAX, MAX_COLLARS_BOUGHT, MAX_EARN_PER_SECOND, MAX_PURCHASED_PROPS, MAX_TREES, MIGRATION_GRANT_MAX, WALLET_MAX } from '../../../shared/parkLimits'
export { GRAVEL_TILES_PER_PACK, STONE_TILES_PER_PACK, TREE_CHARGES_PER_PACK } from '../../../shared/shopPrices'

export const catchTokens: Record<CatchKind, number> = {
  loose: 1,
  stolen: 3,
}

export const tierThresholds: Record<ShopTier, number> = {
  0: 0,
  1: 50,
  2: 250,
  3: 800,
  4: 1800,
}

export const REFUND_RATE = 0.5
export const REFUND_GRACE_SECONDS = 10
export const STEAL_MIN_HOLD_SECONDS = 0.4
export const PURCHASE_COOLDOWN_SECONDS = 0.12
export const RECENT_LEDGER_LENGTH = 24
export const MIN_AWAKE_CATS = 4
