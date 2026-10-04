import type { Random } from '../random'
import type { CatState } from '../types'
import { HAPPINESS_BASELINE, HAPPY_THRESHOLD, UNHAPPY_THRESHOLD } from './happinessCatalog'

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function initialHappiness(random: Random): number {
  return random.range(0.4, 0.58)
}

export function happinessOf(cat: CatState): number {
  const value = cat.happiness
  return typeof value === 'number' && Number.isFinite(value) ? clampUnit(value) : HAPPINESS_BASELINE
}

export function adjustHappiness(cat: CatState, amount: number): void {
  cat.happiness = clampUnit(happinessOf(cat) + amount)
}

export function isHappy(cat: CatState): boolean {
  return happinessOf(cat) >= HAPPY_THRESHOLD
}

export function isUnhappy(cat: CatState): boolean {
  return happinessOf(cat) <= UNHAPPY_THRESHOLD
}

export function requestEagerness(cat: CatState): number {
  return 0.75 + happinessOf(cat) * 0.5
}

export function needPatienceFactor(cat: CatState): number {
  return 1.3 - happinessOf(cat) * 0.6
}

export function playfulnessFactor(cat: CatState): number {
  return 0.6 + happinessOf(cat) * 0.8
}

export function lazinessFactor(cat: CatState): number {
  return 1.25 - happinessOf(cat) * 0.5
}
