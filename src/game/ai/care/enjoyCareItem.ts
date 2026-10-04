import type { Behavior } from '../behavior'
import { spawnEffect } from '../../effects'
import type { CatMind, StepContext } from '../../memory'
import type { CatPose, CatState } from '../../types'
import type { CareItemKind } from '../../care/careTypes'
import { lockPose, setAction, setEmote } from '../helpers/pose'
import { mouthPoint, zeroVector } from '../helpers/queries'
import { brake } from '../helpers/steering'
import { feed, raiseAffection } from '../tools/support/affection'
import { chain, every } from '../tools/support/phases'

const enjoyPoses: Record<CareItemKind, CatPose> = {
  fish: 'eat',
  milk: 'eat',
  yarn: 'crouch',
  brush: 'purr',
  treat: 'eat',
}

const careKindKey = 'careKind'

function careKindOf(mind: CatMind): CareItemKind {
  return (mind.scratchIds[careKindKey] as CareItemKind | undefined) ?? 'treat'
}

export function startCareEnjoyment(cat: CatState, mind: CatMind, context: StepContext, kind: CareItemKind): void {
  const { world } = context
  mind.scratchIds[careKindKey] = kind
  mind.idlePose = enjoyPoses[kind]
  spawnEffect(world, 'sparkle', cat.position, cat.height + 34 * cat.coat.scale, null, 0.7)
  if (kind === 'fish') {
    setAction(cat, 'munch')
    setEmote(cat, 'proud')
    feed(cat, 0.4)
  } else if (kind === 'milk') {
    setEmote(cat, 'love')
    feed(cat, 0.15)
    raiseAffection(cat, 0.05)
  } else if (kind === 'yarn') {
    setEmote(cat, 'playful')
    lockPose(mind, 'pounce', 0.3)
    spawnEffect(world, 'yarn', mouthPoint(cat), 0, null, 1)
    raiseAffection(cat, 0.08)
  } else if (kind === 'brush') {
    setAction(cat, 'purr')
    setEmote(cat, 'love')
    raiseAffection(cat, 0.3)
    spawnEffect(world, 'furTuft', cat.position, cat.height + 18 * cat.coat.scale, null, 0.8)
  } else {
    setAction(cat, 'munch')
    setEmote(cat, 'proud')
    feed(cat, 0.2)
    raiseAffection(cat, 0.15)
  }
}

function enjoyStep(cat: CatState, mind: CatMind, context: StepContext, kind: CareItemKind): void {
  const { world } = context
  if (kind === 'fish' || kind === 'treat') {
    if (every(mind, context, 'crumbs', 0.45)) spawnEffect(world, 'crumbs', mouthPoint(cat), 4, null, 0.45)
    if (every(mind, context, 'munch', 1.2)) setAction(cat, 'munch')
    return
  }
  if (kind === 'milk') {
    if (every(mind, context, 'lap', 0.6)) spawnEffect(world, 'splash', mouthPoint(cat), 0, null, 0.18)
    return
  }
  if (kind === 'yarn') {
    if (every(mind, context, 'swat', 0.55)) lockPose(mind, context.memory.random.pick(['bat', 'pounce', 'bellyUp'] as const), 0.32)
    if (every(mind, context, 'roll', 0.9)) spawnEffect(world, 'yarn', mouthPoint(cat), 0, null, 0.8)
    return
  }
  if (every(mind, context, 'hearts', 0.8)) spawnEffect(world, 'hearts', cat.position, cat.height + 34 * cat.coat.scale, null, 0.75)
  if (every(mind, context, 'purr', 1.3)) setAction(cat, 'purr')
}

export const enjoyCareItemBehavior: Behavior = {
  id: 'enjoyCareItem',
  intent: 'socialize',
  interruptible: false,
  ownsTimer: true,
  elevated: true,
  recencyPenalty: 0,
  minDuration: 2.2,
  maxDuration: 2.8,
  weight: () => 0,
  start(_cat, mind) {
    mind.idlePose = 'sit'
  },
  update(cat, mind, context) {
    const kind = careKindOf(mind)
    mind.idlePose = enjoyPoses[kind]
    if (cat.intentTimer <= 0) {
      chain(cat, mind, context, 'celebrate', 0, context.memory.random.range(1, 1.5))
      return zeroVector
    }
    enjoyStep(cat, mind, context, kind)
    return brake(cat)
  },
}
