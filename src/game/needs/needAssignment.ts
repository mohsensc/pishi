import type { CareItemKind } from '../care/careTypes'
import { mindOf } from '../ai/helpers/queries'
import type { StepContext } from '../memory'
import type { CatState } from '../types'
import { NEED_PATIENCE, requestableKinds } from './needCatalog'
import type { NeedRecord } from './needTypes'

const repeatPenalty = 0.35
const sharedPenalty = 0.5

function kindAppetite(cat: CatState, context: StepContext, kind: CareItemKind): number {
  const personality = mindOf(cat, context).personality
  if (kind === 'fish') return 0.8 + (1 - cat.fullness) * 2
  if (kind === 'milk') return 0.9 + personality.laziness * 0.6
  if (kind === 'yarn') return 0.7 + personality.zoominess * 1.2
  return 0.7 + (1 - cat.affection) * 1.4
}

function wantedCount(context: StepContext, kind: CareItemKind, excludeId: string): number {
  return context.world.cats.reduce((count, other) => (other.id !== excludeId && other.need === kind ? count + 1 : count), 0)
}

function pickNeed(cat: CatState, context: StepContext, record: NeedRecord): CareItemKind {
  const weights = requestableKinds.map((kind) => {
    const repeat = record.lastNeed === kind ? repeatPenalty : 1
    const shared = Math.pow(sharedPenalty, wantedCount(context, kind, cat.id))
    return kindAppetite(cat, context, kind) * repeat * shared
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = context.memory.random.next() * total
  for (let index = 0; index < requestableKinds.length; index += 1) {
    roll -= weights[index]
    if (roll <= 0) return requestableKinds[index]
  }
  return requestableKinds[0]
}

export function assignNeed(cat: CatState, context: StepContext, record: NeedRecord): void {
  const kind = pickNeed(cat, context, record)
  cat.need = kind
  cat.needUrge = 0
  record.lastNeed = kind
  record.patience = context.memory.random.range(NEED_PATIENCE[0], NEED_PATIENCE[1])
}
