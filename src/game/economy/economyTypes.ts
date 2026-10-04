import type { CareItemKind } from '../care/careTypes'
import type { BallKind } from '../handlingTypes'
import type { PathStyle } from '../landscape/landscapeTypes'
import type { ToolKind } from '../toolTypes'
import type { PropKind, Vec } from '../types'

export type ShopCategory = 'static' | 'moving' | 'water' | 'toy' | 'tool' | 'care' | 'collar' | 'clearing' | 'path'

export type ShopTier = 0 | 1 | 2 | 3 | 4

export type ShopItemId =
  | 'cushion'
  | 'cardboardBox'
  | 'rock'
  | 'flowerBed'
  | 'scratchingPost'
  | 'yarnBasket'
  | 'foodBowl'
  | 'bush'
  | 'sapling'
  | 'picnicBlanket'
  | 'bench'
  | 'lamppost'
  | 'tunnel'
  | 'catTree'
  | 'pond'
  | 'fountain'
  | 'birdbath'
  | 'pinwheel'
  | 'springToy'
  | 'birdFeeder'
  | 'swing'
  | 'butterflyHouse'
  | 'sprinkler'
  | 'windmill'
  | 'bubbleMachine'
  | 'toyMouse'
  | 'toolTreat'
  | 'toolBrush'
  | 'toolWand'
  | 'toolLaser'
  | 'toolCatnip'
  | 'careFish'
  | 'careMilk'
  | 'careYarn'
  | 'careBrush'
  | 'careTreat'
  | 'collar'
  | 'treeCharges'
  | 'pathGravel'
  | 'pathStone'

export type ShopGrant =
  | { type: 'prop'; kind: PropKind }
  | { type: 'toy'; kind: BallKind }
  | { type: 'tool'; tool: ToolKind }
  | { type: 'care'; kind: CareItemKind }
  | { type: 'collar' }
  | { type: 'treeCharges'; charges: number }
  | { type: 'pathTiles'; style: PathStyle; tiles: number }

export interface ShopEntry {
  id: ShopItemId
  category: ShopCategory
  price: number
  tier: ShopTier
  grant: ShopGrant
  priceStep: number
  maxOwned: number | null
  refundable: boolean
}

export interface Holding {
  itemId: ShopItemId
  paid: number
  placedAt: number
}

export type LedgerReason = 'catch' | 'steal' | 'migration' | 'purchase' | 'refund'

export interface LedgerEntry {
  id: string
  reason: LedgerReason
  amount: number
  itemId: ShopItemId | null
  time: number
}

export interface TokenEvent {
  id: string
  reason: LedgerReason
  amount: number
  itemId: ShopItemId | null
  position: Vec | null
  time: number
}

export type DenyReason = 'unknownItem' | 'tierLocked' | 'insufficientFunds' | 'capReached' | 'alreadyOwned' | 'noSpace' | 'notRefundable' | 'notOwned' | 'throttled'

export interface DeniedEvent {
  id: string
  itemId: ShopItemId | null
  reason: DenyReason
  position: Vec | null
  time: number
}

export interface ShopOffer {
  itemId: ShopItemId
  price: number
  owned: number
  blocker: DenyReason | null
  tierOpen: boolean
  tierProgress: number
  affordProgress: number
}

export interface NextGoal {
  itemId: ShopItemId
  price: number
  progress: number
}

export interface TierStanding {
  tier: ShopTier
  nextTier: ShopTier | null
  floor: number
  ceiling: number | null
  progress: number
}

export interface EconomyState {
  wallet: number
  lifetimeEarned: number
  lifetimeSpent: number
  lifetimeRefunded: number
  holdings: Record<string, Holding>
  ownedTools: ToolKind[]
  grantedTools: ToolKind[]
  collarsBought: number
  grantedCollars: number
  treeCharges: number
  treeChargesBought: number
  treesCleared: number
  pathStock: Record<PathStyle, number>
  pathBought: Record<PathStyle, number>
  serial: number
  recent: LedgerEntry[]
  lastMint: TokenEvent | null
  lastSpend: TokenEvent | null
  lastDenied: DeniedEvent | null
}

export interface PurchaseMeta {
  point?: Vec | null
  silent?: boolean
}

export type PurchaseResult =
  | { ok: true; itemId: ShopItemId; paid: number; holdingId: string | null; wallet: number }
  | { ok: false; itemId: ShopItemId | null; reason: DenyReason; price: number; wallet: number }

export type RefundResult = { ok: true; holdingId: string; refunded: number; wallet: number } | { ok: false; holdingId: string; reason: DenyReason }

export interface MintResult {
  minted: number
  wallet: number
  ballId: string
}
