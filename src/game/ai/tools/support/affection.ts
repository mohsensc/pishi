import type { CatState } from '../../../types'

export function raiseAffection(cat: CatState, amount: number): void {
  cat.affection = Math.max(0, Math.min(1, cat.affection + amount))
}

export function feed(cat: CatState, amount: number): void {
  cat.fullness = Math.max(0, Math.min(1, cat.fullness + amount))
}
