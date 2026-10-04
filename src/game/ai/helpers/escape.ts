import type { CatMind, StepContext } from '../../memory'
import { distance, distanceToSegment } from '../../vector'
import type { CatIntent, CatState } from '../../types'
import { isBoxFree } from './hiding'
import { findPerchPlan } from './perch'
import { canHideMore, nearestProp, randomTimer, weightedPick } from './queries'
import { beginClimb, beginFlee, beginPass, beginStash, beginTunnel } from './transitions'

const unavailableTeammateIntents: CatIntent[] = ['napping', 'tunnelRun', 'stashBall', 'retrieveBall', 'climb', 'perch', 'passBall', 'celebrate', 'carryBall', 'fleeCursor', 'hide']

export function pickTeammate(cat: CatState, context: StepContext): CatState | undefined {
  const scaleFactor = context.memory.sizeScale
  let best: CatState | undefined
  let bestScore = Number.NEGATIVE_INFINITY
  context.world.cats.forEach((other) => {
    if (other.id === cat.id || other.hidden || other.heldBallId || unavailableTeammateIntents.includes(other.intent)) return
    const otherMind = context.memory.minds.get(other.id)
    if (!otherMind || otherMind.leap) return
    const gap = distance(cat.position, other.position)
    if (gap < 90 * scaleFactor || gap > 520 * scaleFactor) return
    const cursorGap = context.pointer.active ? distance(context.pointer.position, other.position) : 400
    const lineRisk = context.pointer.active ? distanceToSegment(context.pointer.position, cat.position, other.position) : 400
    const score = cursorGap + Math.min(lineRisk, 200) * 0.6 - gap * 0.2
    if (score > bestScore) {
      bestScore = score
      best = other
    }
  })
  return best
}

type EscapeChoice = 'pass' | 'climb' | 'stash' | 'tunnel' | 'flee'

export function chooseEscape(cat: CatState, mind: CatMind, context: StepContext, allowFlee: boolean): void {
  const scaleFactor = context.memory.sizeScale
  const teammate = pickTeammate(cat, context)
  const plan = cat.height < 1 ? findPerchPlan(cat, mind, context, true, 260 * scaleFactor) : null
  const hideable = canHideMore(context)
  const box = nearestProp(cat, context, 'cardboardBox', 240 * scaleFactor, (prop) => isBoxFree(prop, context))
  const tunnel = hideable ? nearestProp(cat, context, 'tunnel', 280 * scaleFactor, (prop) => prop.occupantIds.length === 0) : undefined
  const choice = weightedPick<EscapeChoice>(context, [
    ['pass', teammate ? 1.1 : 0],
    ['climb', plan ? 0.45 : 0],
    ['stash', box ? 0.35 : 0],
    ['tunnel', tunnel ? 0.45 : 0],
    ['flee', allowFlee ? 1 : 0.05],
  ])
  if (choice === 'pass' && teammate) beginPass(cat, mind, context, teammate)
  else if (choice === 'climb' && plan) beginClimb(cat, mind, context, plan)
  else if (choice === 'stash' && box) beginStash(cat, mind, context, box)
  else if (choice === 'tunnel' && tunnel) beginTunnel(cat, mind, context, tunnel)
  else beginFlee(cat, mind, context, randomTimer(context, 1.6, 3))
}
