import { clampToBounds } from '../../bounds'
import { perchLevelsOf } from '../../layout'
import type { CatMind, LandAction, PerchSpot, StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState, PropState } from '../../types'
import { startLeap } from './leap'
import { catRadius, findProp, isOpenGround } from './queries'
import { fleeRadius } from './threat'

export function isPerchSpotTaken(context: StepContext, propId: string, level: number, selfId: string): boolean {
  return context.world.cats.some((other) => {
    if (other.id === selfId) return false
    const otherMind = context.memory.minds.get(other.id)
    if (!otherMind) return false
    const taken = otherMind.perch && otherMind.perch.propId === propId && otherMind.perch.level === level
    const planned = otherMind.climbPlan && otherMind.climbPlan.propId === propId && otherMind.climbPlan.level === level && other.intent === 'climb'
    return Boolean(taken || planned)
  })
}

export function perchSpotFor(prop: PropState, level: number, worldHeight: number): PerchSpot | null {
  const levels = perchLevelsOf(prop, worldHeight)
  const chosen = levels[level]
  if (!chosen) return null
  return { propId: prop.id, level, spot: { x: prop.position.x + chosen.offsetX, y: prop.position.y + 1 }, height: chosen.height }
}

export function findPerchPlan(cat: CatState, mind: CatMind, context: StepContext, treesOnly: boolean, maxDistance: number): PerchSpot | null {
  const random = context.memory.random
  const candidates: { plan: PerchSpot; score: number }[] = []
  context.world.props.forEach((prop) => {
    if (treesOnly && prop.kind !== 'catTree') return
    const levels = perchLevelsOf(prop, context.world.height)
    if (levels.length === 0) return
    if (prop.kind === 'cardboardBox' && prop.occupantIds.length > 0) return
    const gap = distance(cat.position, prop.position)
    if (gap > maxDistance) return
    if (context.pointer.active && treesOnly && distance(context.pointer.position, prop.position) < fleeRadius(cat, mind, context) * 0.5) return
    const reachable = prop.kind === 'catTree' ? Math.min(levels.length, mind.personality.climbLevels) : levels.length
    for (let level = reachable - 1; level >= 0; level -= 1) {
      if (isPerchSpotTaken(context, prop.id, level, cat.id)) continue
      const plan = perchSpotFor(prop, level, context.world.height)
      if (!plan) continue
      const preference = prop.kind === 'catTree' ? level * 40 : 0
      candidates.push({ plan, score: gap - preference + random.range(0, 80) })
      if (treesOnly) break
    }
  })
  candidates.sort((first, second) => first.score - second.score)
  return candidates[0]?.plan ?? null
}

export function dismount(cat: CatState, mind: CatMind, context: StepContext, onLand: LandAction): void {
  const prop = findProp(context, mind.perch?.propId ?? mind.climbPlan?.propId ?? cat.propId)
  const random = context.memory.random
  let side: number = random.sign()
  if (context.pointer.active) side = context.pointer.position.x > cat.position.x ? -1 : 1
  const origin = prop?.position ?? cat.position
  const reach = (prop?.radius ?? 20) + catRadius(cat) + 18
  let landing = clampToBounds({ x: origin.x + side * reach, y: origin.y + reach * 0.5 }, context.bounds)
  if (!isOpenGround(landing, context, catRadius(cat))) landing = clampToBounds({ x: origin.x - side * reach, y: origin.y + reach * 0.6 }, context.bounds)
  mind.perch = null
  mind.climbPlan = null
  cat.propId = null
  startLeap(cat, mind, context, landing, 0, 16, 0.32 + cat.height / 700, 'jump', onLand)
}
