import { unlockCareItem } from '../care/inventory'
import type { StepContext } from '../memory'
import { progressOf } from '../progress/progress'
import { defaultPlacementPoint, placeShopProp } from '../shopItems/placeShopItem'
import { removeLooseToy, removeProp, spawnLooseToy } from '../spawning'
import type { Vec, World } from '../types'
import { PURCHASE_COOLDOWN_SECONDS } from './economyConstants'
import { economyOf } from './economyState'
import type { DenyReason, PurchaseMeta, PurchaseResult, ShopEntry, ShopItemId } from './economyTypes'
import { debitTokens, noteDenied } from './ledger'
import { priceOf, purchaseBlocker } from './pricing'
import { findShopEntry } from './shopCatalog'

interface Fulfillment {
  holdingId: string | null
  position: Vec | null
  undo: () => void
}

const lastPurchaseTimes = new WeakMap<World, Map<ShopItemId, number>>()
const throttledGrants = new Set<ShopEntry['grant']['type']>(['prop', 'toy', 'care', 'collar', 'tool'])

function purchaseTimesOf(world: World): Map<ShopItemId, number> {
  let times = lastPurchaseTimes.get(world)
  if (!times) {
    times = new Map()
    lastPurchaseTimes.set(world, times)
  }
  return times
}

function isThrottled(world: World, entry: ShopEntry): boolean {
  if (!throttledGrants.has(entry.grant.type)) return false
  const last = purchaseTimesOf(world).get(entry.id)
  return last !== undefined && world.time - last < PURCHASE_COOLDOWN_SECONDS && world.time >= last
}

function finitePoint(point: Vec | null | undefined): Vec | null {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? { x: point.x, y: point.y } : null
}

function granted(position: Vec | null, undo: () => void): Fulfillment {
  return { holdingId: null, position, undo }
}

function fulfill(context: StepContext, entry: ShopEntry, point: Vec | null): Fulfillment | null {
  const { world } = context
  const economy = economyOf(world)
  const { grant } = entry
  switch (grant.type) {
    case 'prop': {
      const propId = placeShopProp(context, grant.kind, point)
      const prop = propId ? world.props.find((candidate) => candidate.id === propId) : undefined
      if (!propId || !prop) return null
      return { holdingId: propId, position: { ...prop.position }, undo: () => removeProp(world, propId) }
    }
    case 'toy': {
      const target = point ?? defaultPlacementPoint(context)
      const toyId = spawnLooseToy(world, grant.kind, target)
      return toyId ? granted(target, () => removeLooseToy(world, toyId)) : null
    }
    case 'tool':
      if (economy.ownedTools.includes(grant.tool)) return null
      economy.ownedTools = [...economy.ownedTools, grant.tool]
      return granted(point, () => {
        economy.ownedTools = economy.ownedTools.filter((tool) => tool !== grant.tool)
      })
    case 'care': {
      const item = unlockCareItem(context, grant.kind)
      return item
        ? granted(point, () => {
            world.care.inventory = world.care.inventory.filter((candidate) => candidate.id !== item.id)
          })
        : null
    }
    case 'collar':
      progressOf(world).collars += 1
      economy.collarsBought += 1
      return granted(point, () => {
        progressOf(world).collars = Math.max(0, progressOf(world).collars - 1)
        economy.collarsBought = Math.max(0, economy.collarsBought - 1)
      })
    case 'treeCharges':
      economy.treeCharges += grant.charges
      economy.treeChargesBought += grant.charges
      return granted(point, () => {
        economy.treeCharges = Math.max(0, economy.treeCharges - grant.charges)
        economy.treeChargesBought = Math.max(0, economy.treeChargesBought - grant.charges)
      })
    case 'pathTiles':
      economy.pathStock = { ...economy.pathStock, [grant.style]: economy.pathStock[grant.style] + grant.tiles }
      economy.pathBought = { ...economy.pathBought, [grant.style]: economy.pathBought[grant.style] + grant.tiles }
      return granted(point, () => {
        economy.pathStock = { ...economy.pathStock, [grant.style]: Math.max(0, economy.pathStock[grant.style] - grant.tiles) }
        economy.pathBought = { ...economy.pathBought, [grant.style]: Math.max(0, economy.pathBought[grant.style] - grant.tiles) }
      })
  }
}

function deny(world: World, itemId: ShopItemId | null, reason: DenyReason, price: number, silent: boolean, point: Vec | null): PurchaseResult {
  if (!silent) noteDenied(world, itemId, reason, point)
  return { ok: false, itemId, reason, price, wallet: economyOf(world).wallet }
}

export function purchase(context: StepContext, itemId: ShopItemId, meta: PurchaseMeta = {}): PurchaseResult {
  const { world } = context
  const silent = meta.silent ?? false
  const point = finitePoint(meta.point)
  const entry = findShopEntry(itemId)
  if (!entry) return deny(world, null, 'unknownItem', 0, silent, point)
  const price = priceOf(world, entry.id)
  if (isThrottled(world, entry)) return deny(world, entry.id, 'throttled', price, true, point)
  const blocker = purchaseBlocker(world, entry.id)
  if (blocker) return deny(world, entry.id, blocker, price, silent, point)
  const fulfilled = fulfill(context, entry, point)
  if (!fulfilled) return deny(world, entry.id, 'noSpace', price, silent, point)
  if (!debitTokens(world, price, entry.id, fulfilled.position)) {
    fulfilled.undo()
    return deny(world, entry.id, 'insufficientFunds', price, silent, point)
  }
  const economy = economyOf(world)
  if (fulfilled.holdingId) economy.holdings = { ...economy.holdings, [fulfilled.holdingId]: { itemId: entry.id, paid: price, placedAt: world.time } }
  purchaseTimesOf(world).set(entry.id, world.time)
  return { ok: true, itemId: entry.id, paid: price, holdingId: fulfilled.holdingId, wallet: economy.wallet }
}
