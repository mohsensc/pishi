import type { StepContext } from '../memory'
import { economyOf } from './economyState'
import { noteDenied } from './ledger'
import { purchase } from './purchase'

export type TreeChargeResult = { ok: true; chargesLeft: number } | { ok: false }

export function treeRemovalCharges(context: StepContext): number {
  return economyOf(context.world).treeCharges
}

function isStandingTree(context: StepContext, propId: string): boolean {
  return context.world.props.some((prop) => prop.id === propId && prop.kind === 'tree')
}

function rechargeIfEmpty(context: StepContext, propId: string): boolean {
  const economy = economyOf(context.world)
  if (economy.treeCharges > 0) return true
  const tree = context.world.props.find((prop) => prop.id === propId)
  const bought = purchase(context, 'treeCharges', { silent: true, point: tree ? tree.position : null })
  if (!bought.ok) noteDenied(context.world, 'treeCharges', bought.reason, tree ? tree.position : null)
  return bought.ok
}

export function spendTreeCharge(context: StepContext, propId: string): TreeChargeResult {
  if (!isStandingTree(context, propId) || !rechargeIfEmpty(context, propId)) return { ok: false }
  const economy = economyOf(context.world)
  economy.treeCharges -= 1
  economy.treesCleared += 1
  return { ok: true, chargesLeft: economy.treeCharges }
}
