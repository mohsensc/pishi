import { adjustHappiness } from '../../../happiness/happiness'
import { AFFECTION_TO_HAPPINESS, FEEDING_TO_HAPPINESS } from '../../../happiness/happinessCatalog'
import type { CatState } from '../../../types'

export function raiseAffection(cat: CatState, amount: number): void {
  cat.affection = Math.max(0, Math.min(1, cat.affection + amount))
  if (amount > 0) adjustHappiness(cat, amount * AFFECTION_TO_HAPPINESS)
}

export function feed(cat: CatState, amount: number): void {
  cat.fullness = Math.max(0, Math.min(1, cat.fullness + amount))
  if (amount > 0) adjustHappiness(cat, amount * FEEDING_TO_HAPPINESS)
}
