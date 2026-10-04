import type { Behavior } from '../behavior'
import type { CatMind, PerchSpot, StepContext } from '../../memory'
import type { CatIntent, CatPose, CatState, PropKind, PropState, Vec } from '../../types'
import { mountSpot, holdSpot, spotFree } from './propSpots'
import { bailIfThreatened, enterPhase, finishUse, hasProp, isOvertime, pickProp, quit, releaseProp, travel } from './propUse'
import { findProp, randomTimer, zeroVector } from './queries'
import { brake } from './steering'

export interface PerchRestOptions {
  id: string
  intent?: CatIntent
  kinds: readonly PropKind[]
  range: number
  minDuration: number
  maxDuration: number
  restPose: CatPose
  mountPose?: CatPose
  threatFactor?: number
  weight(cat: CatState, mind: CatMind, context: StepContext): number
  spotsFor(prop: PropState, cat: CatState, context: StepContext): PerchSpot[]
  approachFor(prop: PropState, spot: PerchSpot, cat: CatState, context: StepContext): Vec
  onSettle?(cat: CatState, mind: CatMind, context: StepContext, prop: PropState): void
  onRest?(cat: CatState, mind: CatMind, context: StepContext, prop: PropState): void
}

function freeSpots(options: PerchRestOptions, prop: PropState, cat: CatState, context: StepContext): PerchSpot[] {
  if (prop.occupantIds.some((id) => id !== cat.id)) return []
  return options.spotsFor(prop, cat, context).filter((spot) => spotFree(context, spot, cat.id))
}

export function createPerchRest(options: PerchRestOptions): Behavior {
  const hasSpot = (prop: PropState, cat: CatState, context: StepContext) => freeSpots(options, prop, cat, context).length > 0
  return {
    id: options.id,
    intent: options.intent ?? 'useProp',
    interruptible: false,
    ownsTimer: true,
    elevated: true,
    minDuration: options.minDuration,
    maxDuration: options.maxDuration,
    weight(cat, mind, context) {
      if (cat.height > 1) return 0
      const base = options.weight(cat, mind, context)
      if (!(base > 0)) return 0
      return hasProp(cat, context, options.kinds, options.range, (prop) => hasSpot(prop, cat, context)) ? base : 0
    },
    start(cat, mind, context) {
      mind.propTargetId = pickProp(cat, context, options.kinds, options.range, (prop) => hasSpot(prop, cat, context))?.id ?? null
      mind.idlePose = 'sit'
    },
    update(cat, mind, context) {
      const prop = findProp(context, mind.propTargetId)
      if (!prop) return finishUse(cat, mind, context)
      if (mind.phase === 'start' || mind.phase === 'go') {
        if (bailIfThreatened(cat, mind, context, 0.8)) return zeroVector
        if (cat.height > 1) return finishUse(cat, mind, context)
        const spots = freeSpots(options, prop, cat, context)
        const chosen = spots.find((spot) => spot.level === mind.scratchNumbers.level) ?? spots[0]
        if (!chosen) return quit(cat, mind, context)
        if (mind.phase === 'start') enterPhase(mind, 'go')
        mind.scratchNumbers.level = chosen.level
        const velocity = travel(cat, mind, context, options.approachFor(prop, chosen, cat, context), 0.5, 14)
        if (velocity) return velocity
        mountSpot(cat, mind, context, chosen, options.mountPose ?? 'jump')
        enterPhase(mind, 'mounted')
        cat.intentTimer = Math.max(cat.intentTimer, 3)
        return zeroVector
      }
      if (!holdSpot(cat, mind)) return finishUse(cat, mind, context)
      if (mind.phase === 'mounted') {
        enterPhase(mind, 'rest', randomTimer(context, 0.8, 1.6))
        mind.idlePose = options.restPose
        if (options.onSettle) options.onSettle(cat, mind, context, prop)
      }
      if (bailIfThreatened(cat, mind, context, options.threatFactor ?? 0.6)) return zeroVector
      if (options.onRest) options.onRest(cat, mind, context, prop)
      if (cat.intentTimer <= 0 || isOvertime(cat)) return finishUse(cat, mind, context)
      return brake(cat)
    },
    finish(cat, mind, context) {
      releaseProp(cat, mind, context)
    },
  }
}
