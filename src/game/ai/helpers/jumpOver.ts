import { propSolidHeight } from '../../layout'
import type { CatMind, StepContext } from '../../memory'
import { add, dot, length, scale, subtract } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { startLeap } from './leap'
import { bodyLength, catRadius, isOpenGround } from './queries'
import { topSpeed } from './threat'

const vaultableHeight = 44
const minimumVaultPower = 0.7

interface Hurdle {
  landing: Vec
  peak: number
  span: number
}

function catHurdle(cat: CatState, context: StepContext, heading: Vec): Hurdle | null {
  const reach = bodyLength(cat) * 0.95
  const blocker = context.world.cats.find((other) => {
    if (other.id === cat.id || other.hidden || other.height > 4) return false
    const offset = subtract(other.position, cat.position)
    const along = dot(offset, heading)
    if (along <= 6 || along > reach) return false
    return length(subtract(offset, scale(heading, along))) < 20 * cat.coat.scale
  })
  if (!blocker) return null
  const span = bodyLength(cat) * 1.8
  return { landing: add(cat.position, scale(heading, span)), peak: 30, span }
}

function isVaultable(prop: PropState, mind: CatMind): boolean {
  if (!prop.solid || prop.lift > 0 || prop.tunnelExit || prop.kind === 'pond') return false
  if (prop.id === mind.propTargetId || prop.id === mind.climbPlan?.propId) return false
  const height = propSolidHeight(prop)
  return height > 0 && height <= vaultableHeight
}

function propHurdle(cat: CatState, mind: CatMind, context: StepContext, heading: Vec): Hurdle | null {
  if (mind.personality.jumpPower < minimumVaultPower) return null
  const radius = catRadius(cat)
  const lookAhead = bodyLength(cat) * 1.1
  for (const prop of context.world.props) {
    if (!isVaultable(prop, mind)) continue
    const offset = subtract(prop.position, cat.position)
    const along = dot(offset, heading)
    const clearance = prop.radius + radius
    if (along <= 0 || along > clearance + lookAhead) continue
    if (length(subtract(offset, scale(heading, along))) > prop.radius * 0.85) continue
    const span = along + clearance + 16 * cat.coat.scale
    return { landing: add(cat.position, scale(heading, span)), peak: propSolidHeight(prop) + 18, span }
  }
  return null
}

export function maybeJumpOver(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (mind.jumpOverCooldown > 0 || cat.height > 1 || cat.hidden || (cat.heldBallId !== null && mind.personality.jumpPower < 0.9)) return false
  const speed = length(cat.velocity)
  if (speed < topSpeed(cat, mind, context) * 0.55) return false
  const heading = scale(cat.velocity, 1 / speed)
  const hurdle = catHurdle(cat, context, heading) ?? propHurdle(cat, mind, context, heading)
  if (!hurdle) return false
  const random = context.memory.random
  if (!isOpenGround(hurdle.landing, context, catRadius(cat)) || !random.chance(0.55 + mind.personality.jumpPower * 0.3)) {
    mind.jumpOverCooldown = random.range(0.5, 1)
    return false
  }
  mind.jumpOverCooldown = random.range(1.2, 2.6) / mind.personality.jumpPower
  const duration = 0.3 + hurdle.span / Math.max(500, speed * 1.4)
  startLeap(cat, mind, context, hurdle.landing, 0, hurdle.peak + 14 * mind.personality.jumpPower * cat.coat.scale, duration, 'jump', 'none')
  return true
}
