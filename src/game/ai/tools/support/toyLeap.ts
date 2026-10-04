import type { CatMind, StepContext } from '../../../memory'
import { missesOf, toolMemoryOf, type JumpTool } from '../../../tools/toolState'
import { add, clamp, length, limit, scale, subtract } from '../../../vector'
import type { CatPose, CatState, LeapStyle } from '../../../types'
import { startLeap } from '../../helpers/leap'
import { lockPose, setAction, setEmote } from '../../helpers/pose'
import { weightedPick } from '../../helpers/queries'
import { endBehavior } from '../../helpers/transitions'
import { registerMissOf, toyHeightAbove, usableToy } from './grab'
import { chain, enterPhase } from './phases'
import { bodyTop, maxPeak, pawReach } from './reach'

const leapPoseByStyle: Record<LeapStyle, CatPose> = {
  reach: 'reach',
  springUp: 'jump',
  twistReach: 'reach',
  doubleHop: 'jump',
  swat: 'bat',
  pounceHigh: 'pounce',
}

export interface Windup {
  seconds: number
  pose: CatPose
}

export function windupFor(style: LeapStyle): Windup {
  switch (style) {
    case 'reach':
      return { seconds: 0.35, pose: 'reach' }
    case 'springUp':
      return { seconds: 0.22, pose: 'crouch' }
    case 'twistReach':
      return { seconds: 0.3, pose: 'crouch' }
    case 'doubleHop':
      return { seconds: 0.08, pose: 'crouch' }
    case 'swat':
      return { seconds: 0.15, pose: 'reach' }
    case 'pounceHigh':
      return { seconds: 0.55, pose: 'stalk' }
  }
}

function aimError(cat: CatState, mind: CatMind, context: StepContext, needed: number): number {
  const random = context.memory.random
  const steadiness = clamp(mind.personality.jumpPower, 0.5, 1.4)
  let error = random.range(-1, 1) * (6 + 12 * (1.4 - steadiness)) * cat.coat.scale
  if (random.chance(0.12)) error += random.sign() * Math.max(18 * cat.coat.scale, needed * 0.3)
  return error
}

export function launchToyLeap(cat: CatState, mind: CatMind, context: StepContext, tool: JumpTool, style: LeapStyle): boolean {
  const toy = usableToy(context, tool)
  if (!toy) return false
  const top = bodyTop(cat)
  const paw = pawReach(cat, style)
  const needed = toyHeightAbove(cat, toy) - top - paw * 0.55
  const ceiling = maxPeak(cat, mind, style) * (needed > maxPeak(cat, mind, style) ? 1.1 : 1)
  const peak = clamp(needed + aimError(cat, mind, context, needed), 12 * cat.coat.scale, ceiling)
  const lateral = style === 'twistReach' ? context.memory.random.sign() * 14 * cat.coat.scale : 0
  const apex = { x: toy.position.x + lateral, y: cat.position.y + (toy.position.y - cat.position.y) * 0.3 }
  const travel = limit(subtract(apex, cat.position), 70 * cat.coat.scale)
  const landing = add(cat.position, scale(travel, 2))
  const tempo = style === 'springUp' ? 0.92 : style === 'pounceHigh' ? 1.06 : 1
  const duration = (0.34 + peak / 440) * tempo
  startLeap(cat, mind, context, length(travel) < 2 ? cat.position : landing, 0, peak, duration, leapPoseByStyle[style], 'none')
  cat.leapStyle = style
  mind.scratchNumbers.jumpResult = 0
  mind.scratchNumbers.leapPeak = peak
  const windup = mind.leap?.windup ?? 0
  const takeoffAt = context.world.time + windup
  toolMemoryOf(context.world).jumps.set(cat.id, {
    tool,
    checkAt: takeoffAt + duration * 0.3,
    checkUntil: takeoffAt + duration * 0.7,
    reachTop: top + paw * 1.15,
    reachBottom: top * 0.15,
    resolved: false,
  })
  return true
}

type MissReaction = 'flop' | 'shakeOff' | 'swatAir' | 'groom' | 'stare'

function playMissReaction(cat: CatState, mind: CatMind, context: StepContext): MissReaction {
  const overshoot = (mind.scratchNumbers.leapPeak ?? 0) > 90 * cat.coat.scale
  const reaction =
    weightedPick<MissReaction>(context, [
      ['flop', overshoot ? 2.2 : 0.8],
      ['shakeOff', 1.2],
      ['swatAir', 1 + mind.personality.boldness],
      ['groom', 0.7 + mind.personality.laziness],
      ['stare', 0.6],
    ]) ?? 'stare'
  if (reaction === 'flop') lockPose(mind, 'flop', 0.75)
  if (reaction === 'shakeOff') {
    setAction(cat, 'shakeOff')
    mind.idlePose = 'sit'
  }
  if (reaction === 'swatAir') lockPose(mind, 'bat', 0.35)
  if (reaction === 'stare') mind.idlePose = 'sit'
  if (reaction !== 'stare' && context.memory.random.chance(0.55)) setEmote(cat, 'annoyed')
  return reaction
}

export function handleToyLanding(cat: CatState, mind: CatMind, context: StepContext, tool: JumpTool): void {
  cat.leapStyle = null
  toolMemoryOf(context.world).jumps.delete(cat.id)
  const result = mind.scratchNumbers.jumpResult ?? 0
  if (result > 0) {
    if (tool === 'treat') chain(cat, mind, context, 'munchTreat')
    else chain(cat, mind, context, 'tugOfWar', 3.6)
    return
  }
  if (result === 0) registerMissOf(cat, tool, context)
  if (playMissReaction(cat, mind, context) === 'groom') {
    chain(cat, mind, context, 'embarrassedGroom')
    return
  }
  enterPhase(mind, 'recover', context.memory.random.range(0.4, 0.9))
}

export function decideAfterMiss(cat: CatState, mind: CatMind, context: StepContext, tool: JumpTool): void {
  if (!context.world.heldToy || context.world.heldToy.tool !== tool) {
    endBehavior(cat, mind, context)
    return
  }
  const misses = missesOf(context.world, cat.id)
  if (misses >= 3 && context.memory.random.chance(0.35 + misses * 0.1)) {
    const next = weightedPick(context, [
      ['sulkAfterMisses', 1 + mind.personality.laziness * 2],
      ['sneakyApproach', mind.personality.boldness * 2.5],
      ['watchOthersJump', 0.6],
    ]) ?? 'sulkAfterMisses'
    chain(cat, mind, context, next)
    return
  }
  chain(cat, mind, context, 'beg')
}

export function releaseToyJump(cat: CatState, context: StepContext): void {
  cat.leapStyle = null
  toolMemoryOf(context.world).jumps.delete(cat.id)
}
