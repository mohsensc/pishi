import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import type { CatIntent, CatPose, CatState, PropKind, PropState, Vec } from '../../types'
import { faceToward } from './pose'
import { findProp } from './queries'
import { brake } from './steering'
import { beginBehavior } from './transitions'
import { enterPhase, hasProp, isPropBusy, pickProp, quit, releaseProp, settleAt, travel } from './propUse'

export interface PropVisitOptions {
  id: string
  intent?: CatIntent
  kinds: readonly PropKind[]
  range: number
  minDuration: number
  maxDuration: number
  useDuration: [number, number]
  capacity?: number
  speed?: number
  movePose?: CatPose
  idlePose?: CatPose
  weight(cat: CatState, mind: CatMind, context: StepContext): number
  filter?(prop: PropState, cat: CatState, context: StepContext): boolean
  spotFor(prop: PropState, cat: CatState, context: StepContext): Vec
  lookAt?(prop: PropState, cat: CatState, context: StepContext): Vec
  onArrive?(cat: CatState, mind: CatMind, context: StepContext, prop: PropState): void
  onUse?(cat: CatState, mind: CatMind, context: StepContext, prop: PropState): Vec | void
}

export function summonToProp(cat: CatState, mind: CatMind, context: StepContext, behaviorId: string, prop: PropState, rush = true): void {
  beginBehavior(cat, mind, context, behaviorId)
  mind.propTargetId = prop.id
  mind.scratchNumbers.rush = rush ? 1 : 0
  if (rush) mind.speedBoost = 1.15
}

export function createPropVisit(options: PropVisitOptions): Behavior {
  const capacity = options.capacity ?? 1
  const eligible = (prop: PropState, cat: CatState, context: StepContext) =>
    !isPropBusy(context, prop, cat.id, capacity) && (options.filter ? options.filter(prop, cat, context) : true)
  return {
    id: options.id,
    intent: options.intent ?? 'useProp',
    interruptible: true,
    minDuration: options.minDuration,
    maxDuration: options.maxDuration,
    weight(cat, mind, context) {
      const base = options.weight(cat, mind, context)
      if (!(base > 0)) return 0
      return hasProp(cat, context, options.kinds, options.range, (prop) => eligible(prop, cat, context)) ? base : 0
    },
    start(cat, mind, context) {
      mind.propTargetId = pickProp(cat, context, options.kinds, options.range, (prop) => eligible(prop, cat, context))?.id ?? null
      mind.movePose = options.movePose ?? null
      mind.idlePose = options.idlePose ?? 'sit'
    },
    update(cat, mind, context) {
      const prop = findProp(context, mind.propTargetId)
      if (!prop) return quit(cat, mind, context)
      const focus = options.lookAt ? options.lookAt(prop, cat, context) : prop.position
      if (mind.phase === 'start') {
        mind.scratchPoints.spot = options.spotFor(prop, cat, context)
        enterPhase(mind, 'go')
      }
      if (mind.phase === 'go') {
        const spot = mind.scratchPoints.spot
        const speed = mind.scratchNumbers.rush ? 1 : (options.speed ?? 0.5)
        const velocity = spot ? travel(cat, mind, context, spot, speed) : null
        if (velocity) return velocity
        mind.speedBoost = 1
        settleAt(cat, mind, context, focus, 'use', options.useDuration[0], options.useDuration[1])
        mind.idlePose = options.idlePose ?? 'sit'
        if (options.onArrive) options.onArrive(cat, mind, context, prop)
        return brake(cat)
      }
      if (mind.phase === 'use') {
        if (mind.phaseTimer > mind.holdDuration) return quit(cat, mind, context)
        mind.scratchPoints.gaze = mind.scratchPoints.gaze ?? focus
        const custom = options.onUse ? options.onUse(cat, mind, context, prop) : undefined
        if (custom) return custom
        if (mind.facingHold <= 0) faceToward(cat, mind, focus, 0.5)
        return brake(cat)
      }
      return brake(cat)
    },
    finish(cat, mind, context) {
      releaseProp(cat, mind, context)
    },
  }
}
