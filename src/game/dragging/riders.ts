import { dismount } from '../ai/helpers/perch'
import { lockPose, setEmote } from '../ai/helpers/pose'
import type { CatMind, StepContext } from '../memory'
import { add } from '../vector'
import type { CatState, PropState, Vec } from '../types'

export interface Rider {
  cat: CatState
  mind: CatMind
}

function ridesOn(cat: CatState, mind: CatMind, prop: PropState): boolean {
  if (cat.propId === prop.id) return true
  if (mind.perch?.propId === prop.id) return true
  if (mind.climbPlan?.propId === prop.id && (cat.height > 1 || mind.leap !== null)) return true
  return cat.intent === 'tunnelRun' && mind.propTargetId === prop.id
}

export function ridersOf(prop: PropState, context: StepContext, excludeId: string | null = null): Rider[] {
  const riders: Rider[] = []
  context.world.cats.forEach((cat) => {
    if (cat.id === excludeId) return
    const mind = context.memory.minds.get(cat.id)
    if (mind && ridesOn(cat, mind, prop)) riders.push({ cat, mind })
  })
  return riders
}

function shiftPoint(point: Vec | null, delta: Vec): Vec | null {
  return point ? add(point, delta) : null
}

function shiftMind(mind: CatMind, delta: Vec): void {
  mind.target = shiftPoint(mind.target, delta)
  mind.tunnelFrom = shiftPoint(mind.tunnelFrom, delta)
  mind.tunnelTo = shiftPoint(mind.tunnelTo, delta)
  if (mind.perch) mind.perch = { ...mind.perch, spot: add(mind.perch.spot, delta) }
  if (mind.climbPlan) mind.climbPlan = { ...mind.climbPlan, spot: add(mind.climbPlan.spot, delta) }
  if (mind.leap) mind.leap = { ...mind.leap, from: add(mind.leap.from, delta), to: add(mind.leap.to, delta) }
  Object.keys(mind.scratchPoints).forEach((key) => {
    if (key !== 'gaze') mind.scratchPoints[key] = add(mind.scratchPoints[key], delta)
  })
}

export function carryRiders(riders: Rider[], delta: Vec, lift: number, carried: boolean): void {
  riders.forEach(({ cat, mind }) => {
    cat.position = add(cat.position, delta)
    shiftMind(mind, delta)
    if (cat.hidden || mind.leap) return
    if (mind.perch) {
      cat.height = mind.perch.height + lift
      cat.velocity = { x: 0, y: 0 }
    }
    if (carried && cat.height > 1) lockPose(mind, 'crouch', 0.2)
  })
}

export function shakeOffRiders(riders: Rider[], context: StepContext): void {
  const random = context.memory.random
  riders.forEach(({ cat, mind }) => {
    if (cat.hidden || mind.leap || cat.height <= 1) return
    const jumpChance = 0.12 + (1 - mind.personality.boldness) * 0.3
    if (!random.chance(jumpChance)) {
      setEmote(cat, random.chance(0.5) ? 'curious' : 'startled')
      return
    }
    dismount(cat, mind, context, 'startle')
    setEmote(cat, 'startled')
  })
}
