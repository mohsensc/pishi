import type { StepContext } from '../memory'
import type { PathStyle } from '../landscape/landscapeTypes'
import type { World } from '../types'
import { economyOf } from './economyState'
import type { ShopItemId } from './economyTypes'
import { noteDenied } from './ledger'
import { purchase } from './purchase'

export const pathPackItems: Record<PathStyle, ShopItemId> = { gravel: 'pathGravel', stone: 'pathStone' }

function restock(context: StepContext, style: PathStyle): boolean {
  const bought = purchase(context, pathPackItems[style], { silent: true })
  if (!bought.ok) noteDenied(context.world, pathPackItems[style], bought.reason)
  return bought.ok
}

export function takePathTiles(context: StepContext, style: PathStyle, count: number): number {
  const economy = economyOf(context.world)
  const wanted = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  let taken = 0
  while (taken < wanted) {
    if (economy.pathStock[style] <= 0 && !restock(context, style)) break
    economy.pathStock = { ...economy.pathStock, [style]: economy.pathStock[style] - 1 }
    taken += 1
  }
  return taken
}

export function returnPathTiles(world: World, style: PathStyle, count: number): void {
  const economy = economyOf(world)
  const room = Math.max(0, economy.pathBought[style] - economy.pathStock[style])
  const returned = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0
  economy.pathStock = { ...economy.pathStock, [style]: economy.pathStock[style] + Math.min(room, returned) }
}
