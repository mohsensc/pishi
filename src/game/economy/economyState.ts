import type { World } from '../types'
import type { EconomyState } from './economyTypes'

export function createEconomyState(): EconomyState {
  return {
    wallet: 0,
    lifetimeEarned: 0,
    lifetimeSpent: 0,
    lifetimeRefunded: 0,
    holdings: {},
    ownedTools: ['hand'],
    grantedTools: [],
    collarsBought: 0,
    grantedCollars: 0,
    treeCharges: 0,
    treeChargesBought: 0,
    treesCleared: 0,
    pathStock: { gravel: 0, stone: 0 },
    pathBought: { gravel: 0, stone: 0 },
    serial: 0,
    recent: [],
    lastMint: null,
    lastSpend: null,
    lastDenied: null,
  }
}

export function economyOf(world: World): EconomyState {
  if (!world.economy) world.economy = createEconomyState()
  return world.economy
}
