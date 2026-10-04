import type { CareItemKind } from '../care/careTypes'

export type SecondsRange = readonly [number, number]

export const requestableKinds: readonly CareItemKind[] = ['fish', 'milk', 'yarn', 'brush']

export const NEED_FIRST_DELAY: SecondsRange = [5, 62]
export const NEED_RETRY_DELAY: SecondsRange = [3, 8]
export const NEED_QUIET_AFTER_GIFT: SecondsRange = [40, 70]
export const NEED_PATIENCE: SecondsRange = [50, 70]
export const MAX_AWAKE_NEEDY_CATS = 3
export const MIN_AWAKE_CATS = 4
export const DROWSY_START_URGE = 0.5
export const MAX_AWAKE_DROWSINESS = 0.85

export const NAP_SECONDS: SecondsRange = [80, 140]
export const NAP_WAKE_URGE = 0.6
export const ROUSE_SECONDS: SecondsRange = [3.5, 5.5]
export const REPOKE_EXTENSION = 1.2
export const DRAG_ROUSE_SECONDS = 4
export const WRONG_GIFT_RELIEF = 0.3
export const WRONG_GIFT_AWAKE_SECONDS = 7
export const WRONG_GIFT_QUIET_SECONDS = 12

export const ZEST_SECONDS = 28
export const ZEST_FADE_SECONDS = 6
export const ZEST_PACE = 0.22
export const DROWSY_PACE = 0.3

export const BALL_STIR_RADIUS = 34
export const BALL_STIR_RATE = 1.6
export const BALL_STIR_COOLDOWN = 7
export const BALL_STIR_SECONDS: SecondsRange = [2.4, 3.4]

export const NEED_DEMAND_AWAKE = 1.2
export const NEED_DEMAND_ASLEEP = 1.8
