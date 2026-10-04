import type { Behavior } from '../behavior'
import { clampToBounds } from '../../bounds'
import { propSolidHeight } from '../../layout'
import type { CatMind, StepContext } from '../../memory'
import { add, distance, normalize, scale } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { startLeap } from '../helpers/leap'
import { setEmote } from '../helpers/pose'
import { bailIfThreatened, enterPhase, pickProp, quit, travel } from '../helpers/propUse'
import { catRadius, findProp, isOpenGround, randomTimer, zeroVector } from '../helpers/queries'
import { brake, seek } from '../helpers/steering'
import { topSpeed } from '../helpers/threat'

const vaultKinds = ['rock', 'cardboardBox', 'bench', 'yarnBasket', 'feedingStation'] as const
const runUpDistance = 90

function canVault(prop: PropState): boolean {
  return prop.solid && prop.lift <= 0 && propSolidHeight(prop) <= 44
}

function sideLanding(prop: PropState, cat: CatState, direction: Vec, context: StepContext): Vec {
  return clampToBounds(add(prop.position, scale(direction, prop.radius + catRadius(cat) + 20 * context.memory.sizeScale)), context.bounds)
}

function runUpPoint(prop: PropState, cat: CatState, mind: CatMind, context: StepContext): Vec | null {
  const side = mind.scratchNumbers.side ?? 1
  const direction = normalize({ x: side, y: context.memory.random.range(-0.35, 0.35) })
  const start = clampToBounds(add(prop.position, scale(direction, prop.radius + runUpDistance * context.memory.sizeScale)), context.bounds)
  const across = sideLanding(prop, cat, scale(direction, -1), context)
  if (!isOpenGround(start, context, catRadius(cat)) || !isOpenGround(across, context, catRadius(cat))) return null
  mind.scratchPoints.landing = across
  return start
}

export const propVaultBehavior: Behavior = {
  id: 'propVault',
  intent: 'play',
  interruptible: false,
  ownsTimer: true,
  minDuration: 5,
  maxDuration: 9,
  weight(cat, mind, context) {
    if (mind.personality.jumpPower < 0.7 || cat.heldBallId || cat.height > 1) return 0
    return pickProp(cat, context, vaultKinds, 380, canVault) ? 0.06 + mind.personality.jumpPower * 0.14 : 0
  },
  start(cat, mind, context) {
    const prop = pickProp(cat, context, vaultKinds, 380, canVault)
    mind.propTargetId = prop?.id ?? null
    mind.scratchNumbers.side = prop && cat.position.x < prop.position.x ? -1 : 1
    mind.scratchNumbers.vaults = context.memory.random.integer(2, 4)
    mind.idlePose = 'crouch'
    setEmote(cat, 'playful')
  },
  update(cat, mind, context) {
    const prop = findProp(context, mind.propTargetId)
    if (!prop || !canVault(prop) || mind.behaviorElapsed > 14) return quit(cat, mind, context)
    if (bailIfThreatened(cat, mind, context)) return zeroVector
    if (mind.phase === 'start') {
      const start = runUpPoint(prop, cat, mind, context)
      if (!start) return quit(cat, mind, context)
      mind.target = start
      enterPhase(mind, 'setup')
    }
    if (mind.phase === 'setup' && mind.target) {
      const velocity = travel(cat, mind, context, mind.target, 0.7, 16)
      if (velocity) return velocity
      enterPhase(mind, 'poise', randomTimer(context, 0.2, 0.5))
      return brake(cat)
    }
    if (mind.phase === 'poise') {
      if (mind.phaseTimer < mind.holdDuration) return brake(cat, 6)
      enterPhase(mind, 'run')
    }
    const landing = mind.scratchPoints.landing
    if (mind.phase === 'run' && landing) {
      const gap = distance(cat.position, prop.position)
      if (gap > prop.radius + catRadius(cat) + 34 * cat.coat.scale && mind.phaseTimer < 2.5) {
        mind.speedBoost = 1.3
        return seek(cat, prop.position, topSpeed(cat, mind, context))
      }
      mind.speedBoost = 1
      const span = distance(cat.position, landing)
      startLeap(cat, mind, context, landing, 0, propSolidHeight(prop) + 22 + 10 * mind.personality.jumpPower, 0.32 + span / 700, 'jump', 'none')
      mind.attempts += 1
      mind.scratchNumbers.side = -(mind.scratchNumbers.side ?? 1)
      enterPhase(mind, mind.attempts >= (mind.scratchNumbers.vaults ?? 2) ? 'done' : 'turn', randomTimer(context, 0.3, 0.7))
      return zeroVector
    }
    if (mind.phase === 'turn') {
      if (mind.phaseTimer < mind.holdDuration) return brake(cat, 5)
      enterPhase(mind, 'start')
      return zeroVector
    }
    if (mind.phase === 'done') {
      if (mind.phaseTimer > mind.holdDuration) setEmote(cat, 'proud')
      if (mind.phaseTimer > mind.holdDuration + 0.4) return quit(cat, mind, context)
      return brake(cat, 5)
    }
    return quit(cat, mind, context)
  },
  finish(_cat, mind) {
    mind.speedBoost = 1
  },
}
