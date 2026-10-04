import type { Behavior } from '../behavior'
import type { CatMind, StepContext } from '../../memory'
import { distance } from '../../vector'
import type { CatState, Vec } from '../../types'
import { lockPose, setEmote } from '../helpers/pose'
import { randomTimer, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { endBehavior } from '../helpers/transitions'
import { gazeAt } from '../tools/support/phases'
import { answeredSince, isGrounded, isHeldByPointer } from './callQueries'

const spectateId = 'spectate'
const watchRange = 520
const idleUrgencyCeiling = 1
const spectateUrgency = 1.3

interface Spectacle {
  point: Vec
  since: number
  kind: 'throw' | 'drag'
}

function thrownSpectacle(context: StepContext): Spectacle | null {
  const ball = context.world.balls
    .filter((candidate) => candidate.status === 'loose' && candidate.thrownAt !== null && context.world.time - candidate.thrownAt < 1.4)
    .sort((first, second) => (second.thrownAt ?? 0) - (first.thrownAt ?? 0))[0]
  if (!ball || ball.thrownAt === null) return null
  return { point: { x: ball.position.x, y: ball.position.y - ball.height }, since: ball.thrownAt, kind: 'throw' }
}

function draggedSpectacle(context: StepContext): Spectacle | null {
  const drag = context.world.drag
  if (!drag || context.world.time - drag.startedAt < 0.3) return null
  return { point: { x: drag.pointer.x, y: drag.pointer.y }, since: drag.startedAt, kind: 'drag' }
}

function currentSpectacle(context: StepContext): Spectacle | null {
  return thrownSpectacle(context) ?? draggedSpectacle(context)
}

function isFree(cat: CatState, mind: CatMind, context: StepContext): boolean {
  if (!isGrounded(cat, mind) || cat.heldBallId || isHeldByPointer(cat, context)) return false
  return mind.behaviorUrgency < idleUrgencyCeiling
}

export const spectateBehavior: Behavior = {
  id: spectateId,
  intent: 'explore',
  interruptible: true,
  recencyPenalty: 0,
  minDuration: 1.6,
  maxDuration: 3,
  weight: () => 0,
  urgency(cat, mind, context) {
    const spectacle = currentSpectacle(context)
    if (!spectacle || !isFree(cat, mind, context)) return 0
    if (answeredSince(mind, spectateId, spectacle.since - 0.01)) return 0
    if (distance(cat.position, spectacle.point) > watchRange * context.memory.sizeScale) return 0
    return context.memory.random.chance(0.35 + mind.personality.curiosity * 0.4) ? spectateUrgency : 0
  },
  start(cat, mind, context) {
    const spectacle = currentSpectacle(context)
    mind.idlePose = context.memory.random.chance(0.4) ? 'crouch' : 'sit'
    if (context.memory.random.chance(0.5)) setEmote(cat, spectacle?.kind === 'throw' ? 'playful' : 'curious')
    if (spectacle?.kind === 'throw' && context.memory.random.chance(0.3)) lockPose(mind, 'startle', 0.25)
    cat.intentTimer = randomTimer(context, 1.4, 2.6)
  },
  update(cat, mind, context) {
    const spectacle = currentSpectacle(context)
    if (!spectacle) {
      if (mind.behaviorElapsed > 0.8) {
        endBehavior(cat, mind, context)
        return zeroVector
      }
      return brake(cat)
    }
    mind.behaviorUrgency = spectateUrgency
    gazeAt(cat, mind, spectacle.point, 0.3)
    return brake(cat)
  },
}
