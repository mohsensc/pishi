import type { CatPose } from '../../../game/types'
import { applyAction } from './actions'
import { applyBat, applyCrouch, applyEat, applyReach, applyScratch, applySniff, applyStretch, applyTug, applyWrestle } from './active'
import { applyPounce, applyStartle } from './airborne'
import { applyJump } from './leapStyles'
import { applyHop, applyRun, applyStalk, applyWalk } from './locomotion'
import { applyBeg, applyGroom, applyKnead, applyLoaf, applyPeek, applyPurr, applySit, applySleep } from './resting'
import type { CatRig, RigApplier, RigInput } from './rigModel'
import { baseRig } from './rigModel'
import { applyArch, applyBellyUp, applyCling, applyFlop } from './sprawled'
import { applyDangle } from './dangle'

const poseAppliers: Record<CatPose, RigApplier> = {
  sit: applySit,
  loaf: applyLoaf,
  walk: applyWalk,
  run: applyRun,
  crouch: applyCrouch,
  jump: applyJump,
  pounce: applyPounce,
  bat: applyBat,
  stretch: applyStretch,
  startle: applyStartle,
  stalk: applyStalk,
  groom: applyGroom,
  scratch: applyScratch,
  bellyUp: applyBellyUp,
  sniff: applySniff,
  eat: applyEat,
  knead: applyKnead,
  arch: applyArch,
  sleep: applySleep,
  hop: applyHop,
  wrestle: applyWrestle,
  cling: applyCling,
  peek: applyPeek,
  beg: applyBeg,
  reach: applyReach,
  flop: applyFlop,
  tug: applyTug,
  purr: applyPurr,
  dangle: applyDangle,
}

const calmPoses = new Set<CatPose>(['sleep', 'purr', 'knead', 'groom', 'bellyUp'])

function applyCarrying(rig: CatRig, input: RigInput): void {
  rig.headAngle -= 12
  rig.headOffsetY -= 1
  rig.mouthOpen = Math.max(rig.mouthOpen, 0.4)
  rig.tongue = 0
  if (!input.napping && input.pose !== 'sleep') rig.eyeOpen = Math.max(rig.eyeOpen, 0.7)
}

function applyStartled(rig: CatRig): void {
  rig.tailPuff = 1
  rig.furPuff = Math.max(rig.furPuff, 0.6)
  rig.earAngle = -24
  rig.pupilDilation = 1
  rig.eyeOpen = 1
  rig.eyeHappy = 0
}

function applyDrowsy(rig: CatRig, input: RigInput): void {
  const drowsiness = Math.min(1, input.drowsiness)
  const nod = Math.max(0, Math.sin(input.time * 0.85)) ** 10 * Math.max(0, drowsiness - 0.35) * 1.5
  rig.eyeOpen = Math.min(rig.eyeOpen, Math.max(0, 1 - drowsiness * 0.62 - nod))
  rig.eyeHappy = Math.max(rig.eyeHappy, drowsiness * 0.3)
  rig.headOffsetY += drowsiness * 2 + nod * 3
  rig.headAngle += drowsiness * 5 + nod * 10
  rig.earAngle += drowsiness * 12
  rig.pupilDilation = Math.min(rig.pupilDilation, 0.5)
  rig.tailCurl *= 1 - drowsiness * 0.3
}

export function computeRig(input: RigInput): CatRig {
  const rig = baseRig(input.dimensions)
  poseAppliers[input.pose](rig, input)
  applyAction(rig, input)
  if (input.carrying) applyCarrying(rig, input)
  if (input.drowsiness > 0.02 && input.pose !== 'sleep') applyDrowsy(rig, input)
  if (input.startled && !calmPoses.has(input.pose)) applyStartled(rig)
  return rig
}

export { blendRig } from './rigModel'
export type { CatRig, RigInput } from './rigModel'
