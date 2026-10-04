import type { LawnBounds } from './bounds'
import type { Personality } from './catalog'
import type { Random } from './random'
import type { BehaviorLibrary } from './ai/behavior'
import type { CatPose, PointerState, Vec, World } from './types'

export type LandAction = 'none' | 'grab' | 'climb' | 'perch' | 'butterfly' | 'startle' | 'ground'

interface BehaviorRecord {
  id: string
  startedAt: number
}

interface Leap {
  from: Vec
  to: Vec
  fromHeight: number
  toHeight: number
  peak: number
  duration: number
  elapsed: number
  pose: CatPose
  onLand: LandAction
  windup: number
  launchVelocity: Vec
}

export interface PerchSpot {
  propId: string
  level: number
  spot: Vec
  height: number
}

export interface CatMind {
  personality: Personality
  phase: string
  phaseTimer: number
  decisionTimer: number
  target: Vec | null
  ballId: string | null
  butterflyId: string | null
  teammateId: string | null
  propTargetId: string | null
  holdDuration: number
  leap: Leap | null
  poseLock: CatPose | null
  poseTimer: number
  regrabBallId: string | null
  regrabUntil: number
  facingHold: number
  facingPressure: number
  carryTime: number
  perch: PerchSpot | null
  climbPlan: PerchSpot | null
  climbStep: number
  jumpOverCooldown: number
  batCooldown: number
  fumbleCooldown: number
  pounceReady: boolean
  attempts: number
  idlePose: CatPose
  movePose: CatPose | null
  napCooldown: number
  calmTimer: number
  tunnelFrom: Vec | null
  tunnelTo: Vec | null
  tunnelProgress: number
  tunnelDuration: number
  speedBoost: number
  behaviorElapsed: number
  behaviorUrgency: number
  urgencyTimer: number
  recentBehaviors: BehaviorRecord[]
  scratchNumbers: Record<string, number>
  scratchPoints: Record<string, Vec>
  scratchIds: Record<string, string>
  pokeCooldown: number
  stuckSeconds: number
  activeBehaviorId: string | null
}

interface StashRecord {
  ballId: string
  propId: string
  since: number
  retrieveAt: number
  stasherId: string
  retrieverId: string | null
}

export interface EngineMemory {
  random: Random
  minds: Map<string, CatMind>
  stashes: Map<string, StashRecord>
  popSerial: number
  ballSerial: number
  lastPointer: PointerState
  sizeScale: number
  speedScale: number
}

export interface StepContext {
  world: World
  memory: EngineMemory
  dt: number
  pointer: PointerState
  bounds: LawnBounds
  library: BehaviorLibrary
}

export function createMind(personality: Personality): CatMind {
  return {
    personality,
    phase: 'start',
    phaseTimer: 0,
    decisionTimer: 0,
    target: null,
    ballId: null,
    butterflyId: null,
    teammateId: null,
    propTargetId: null,
    holdDuration: 0,
    leap: null,
    poseLock: null,
    poseTimer: 0,
    regrabBallId: null,
    regrabUntil: 0,
    facingHold: 0,
    facingPressure: 0,
    carryTime: 0,
    perch: null,
    climbPlan: null,
    climbStep: 0,
    jumpOverCooldown: 0,
    batCooldown: 0,
    fumbleCooldown: 0,
    pounceReady: true,
    attempts: 0,
    idlePose: 'sit',
    movePose: null,
    napCooldown: 0,
    calmTimer: 0,
    tunnelFrom: null,
    tunnelTo: null,
    tunnelProgress: 0,
    tunnelDuration: 0,
    speedBoost: 1,
    behaviorElapsed: 0,
    behaviorUrgency: 0,
    urgencyTimer: 0,
    recentBehaviors: [],
    scratchNumbers: {},
    scratchPoints: {},
    scratchIds: {},
    pokeCooldown: 0,
    stuckSeconds: 0,
    activeBehaviorId: null,
  }
}
