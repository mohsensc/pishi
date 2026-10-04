import { careItemNeeds } from '../care/careCatalog'
import type { CareItemKind, CarePresentation } from '../care/careTypes'
import { registerCareDemand } from '../care/inventory'
import { onCareItemPresented } from '../care/present'
import { setEmote } from '../ai/helpers/pose'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { CatState } from '../types'
import {
  NEED_DEMAND_ASLEEP,
  NEED_DEMAND_AWAKE,
  NEED_QUIET_AFTER_GIFT,
  WRONG_GIFT_AWAKE_SECONDS,
  WRONG_GIFT_QUIET_SECONDS,
  WRONG_GIFT_RELIEF,
  ZEST_SECONDS,
} from './needCatalog'
import { needRecordOf } from './needState'
import { wakeFully } from './sleepControl'
import { adjustHappiness } from '../happiness/happiness'
import { REQUEST_DELIGHT_HAPPINESS, WRONG_GIFT_HAPPINESS } from '../happiness/happinessCatalog'

let hooksInstalled = false

export function fulfillsNeed(want: CareItemKind, kind: CareItemKind): boolean {
  return careItemNeeds[want].every((need) => careItemNeeds[kind].includes(need))
}

function needDemand(context: StepContext): Partial<Record<CareItemKind, number>> {
  const demand: Partial<Record<CareItemKind, number>> = {}
  context.world.cats.forEach((cat) => {
    if (!cat.need || cat.hidden) return
    demand[cat.need] = (demand[cat.need] ?? 0) + (cat.asleep ? NEED_DEMAND_ASLEEP : NEED_DEMAND_AWAKE)
  })
  return demand
}

function delight(cat: CatState, context: StepContext): void {
  const { world, memory } = context
  const record = needRecordOf(context, cat)
  wakeFully(cat, context)
  cat.need = null
  cat.needUrge = 0
  record.nextNeedAt = world.time + memory.random.range(NEED_QUIET_AFTER_GIFT[0], NEED_QUIET_AFTER_GIFT[1])
  record.zestUntil = world.time + ZEST_SECONDS
  record.zestPending = true
  adjustHappiness(cat, REQUEST_DELIGHT_HAPPINESS)
  setEmote(cat, 'love')
  spawnEffect(world, 'hearts', cat.position, cat.height + 44 * cat.coat.scale, null, 1)
  spawnEffect(world, 'sparkle', cat.position, cat.height + 30 * cat.coat.scale, null, 1)
}

function soothe(cat: CatState, context: StepContext): void {
  const { world } = context
  const record = needRecordOf(context, cat)
  cat.needUrge = Math.max(0, (cat.needUrge ?? 0) - WRONG_GIFT_RELIEF)
  adjustHappiness(cat, WRONG_GIFT_HAPPINESS)
  if (cat.asleep) record.rousedUntil = Math.max(record.rousedUntil, world.time + WRONG_GIFT_AWAKE_SECONDS)
  if (!cat.need) record.nextNeedAt = Math.max(record.nextNeedAt, world.time + WRONG_GIFT_QUIET_SECONDS)
}

export function satisfyNeed(cat: CatState, context: StepContext, kind: CareItemKind): boolean {
  if (!cat.need || !fulfillsNeed(cat.need, kind)) return false
  delight(cat, context)
  return true
}

function answerCarePresentation({ context, cat, kind }: CarePresentation): void {
  if (cat.need && fulfillsNeed(cat.need, kind)) delight(cat, context)
  else soothe(cat, context)
}

export function ensureNeedHooks(): void {
  if (hooksInstalled) return
  hooksInstalled = true
  registerCareDemand(needDemand)
  onCareItemPresented(answerCarePresentation)
}
