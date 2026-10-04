import { isFreeForHandling } from '../ai/drag/handlingQueries'
import { mindOf } from '../ai/helpers/queries'
import { beginBehavior } from '../ai/helpers/transitions'
import type { CatMind, StepContext } from '../memory'
import { distance } from '../vector'
import type { BallState, CatState, PropState, Vec } from '../types'

interface Recruitment {
  behaviorId: string
  point: Vec
  radius: number
  limit: number
  urgency: number
  eagerness: (cat: CatState, mind: CatMind) => number
  assign?: (mind: CatMind) => void
}

const busyUrgency = 4
const spectatorId = 'watchThrow'

function isAvailable(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (mind.behaviorUrgency >= busyUrgency) return false
  return cat.behavior === spectatorId || isFreeForHandling(cat, mind, context)
}

function recruit(context: StepContext, recruitment: Recruitment): void {
  const random = context.memory.random
  const reach = recruitment.radius * context.memory.sizeScale
  const candidates = context.world.cats
    .map((cat) => ({ cat, mind: mindOf(cat, context), gap: distance(cat.position, recruitment.point) }))
    .filter(({ cat, mind, gap }) => gap < reach && isAvailable(cat, mind, context))
    .sort((first, second) => first.gap - second.gap)
  let recruited = 0
  for (const { cat, mind } of candidates) {
    if (recruited >= recruitment.limit) break
    if (!random.chance(recruitment.eagerness(cat, mind))) continue
    beginBehavior(cat, mind, context, recruitment.behaviorId, { urgency: recruitment.urgency })
    recruitment.assign?.(mind)
    recruited += 1
  }
}

export function recruitFetchers(ball: BallState, context: StepContext): void {
  recruit(context, {
    behaviorId: 'fetchRace',
    point: ball.position,
    radius: 640,
    limit: 3,
    urgency: 3.6,
    eagerness: (cat, mind) => 0.35 + mind.personality.zoominess * 0.3 + mind.personality.curiosity * 0.15 + cat.affection * 0.25,
    assign: (mind) => {
      mind.scratchIds.ball = ball.id
    },
  })
  recruit(context, {
    behaviorId: spectatorId,
    point: ball.position,
    radius: 480,
    limit: 2,
    urgency: 2.2,
    eagerness: (_cat, mind) => 0.4 + mind.personality.curiosity * 0.4,
    assign: (mind) => {
      mind.scratchIds.ball = ball.id
    },
  })
}

export function recruitInvestigators(prop: PropState, context: StepContext): void {
  recruit(context, {
    behaviorId: 'investigateDrop',
    point: prop.position,
    radius: 380,
    limit: 2,
    urgency: 1.9,
    eagerness: (_cat, mind) => mind.personality.curiosity * 0.7 + mind.personality.boldness * 0.2,
    assign: (mind) => {
      mind.scratchIds.prop = prop.id
    },
  })
}
