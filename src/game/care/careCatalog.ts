import type { CareItemKind, CareNeed, CatchKind } from './careTypes'

export const careItemKinds: readonly CareItemKind[] = ['fish', 'milk', 'yarn', 'brush', 'treat']

export const careItemNeeds: Record<CareItemKind, readonly CareNeed[]> = {
  fish: ['hunger'],
  milk: ['thirst'],
  yarn: ['play'],
  brush: ['affection'],
  treat: ['hunger', 'thirst', 'play', 'affection'],
}

export const careBaseWeights: Record<CareItemKind, number> = {
  fish: 1,
  milk: 1,
  yarn: 1,
  brush: 1,
  treat: 0.45,
}

export const catchPoints: Record<CatchKind, number> = {
  loose: 1,
  stolen: 2,
}

export const CARE_METER_GOAL = 3
export const CARE_TRAY_CAPACITY = 5
export const STEAL_WINDOW_SECONDS = 3
export const CARE_REACH = 46
