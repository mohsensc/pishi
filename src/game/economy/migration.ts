import { legacyToolsFor } from '../../../shared/parkSpendCheck'
import { progressOf } from '../progress/progress'
import type { World } from '../types'
import { MIGRATION_GRANT_MAX } from './economyConstants'
import { economyOf } from './economyState'
import { creditTokens } from './ledger'

export function migrationGrantFor(points: number): number {
  return Number.isFinite(points) ? Math.min(MIGRATION_GRANT_MAX, Math.max(0, Math.floor(points / 2))) : 0
}

export function grantLegacyMigration(world: World, points: number): number {
  const economy = economyOf(world)
  const tools = legacyToolsFor(points)
  economy.ownedTools = ['hand', ...tools]
  economy.grantedTools = [...tools]
  economy.collarsBought = world.cats.filter((cat) => cat.collar).length + progressOf(world).collars
  economy.grantedCollars = economy.collarsBought
  return creditTokens(world, migrationGrantFor(points), 'migration', null, null)
}
