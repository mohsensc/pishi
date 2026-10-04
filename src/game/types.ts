import type { BallKind, DragState, TreatBagShake } from './handlingTypes'

import type { CatnipPatch, HeldToyState, ToolKind, TreatState } from './toolTypes'
import type { CareItemKind, CareState } from './care/careTypes'
import type { ProgressState } from './progress/progressTypes'
import type { EconomyState } from './economy/economyTypes'
import type { LandscapeState } from './landscape/landscapeTypes'
import type { ShopPropKind } from './shopItems/shopPropKinds'

export type { CatnipPatch, HeldToyState, ToolKind, TreatState } from './toolTypes'
export type { CareItem, CareItemKind, CareReward, CareState, TrayItemKind } from './care/careTypes'
export type { ProgressState, UnlockableItemKind } from './progress/progressTypes'
export type { DeniedEvent, EconomyState, NextGoal, ShopItemId, ShopOffer, TierStanding, TokenEvent } from './economy/economyTypes'
export type { LandscapeState, PathStyle } from './landscape/landscapeTypes'
export type { ShopPropKind } from './shopItems/shopPropKinds'
export type { BallKind, DragHit, DragState, DragTarget, SpawnableItem, SpawnablePropKind, TreatBagShake } from './handlingTypes'

export interface Vec {
  x: number
  y: number
}

export type CatPose =
  | 'sit'
  | 'loaf'
  | 'walk'
  | 'run'
  | 'crouch'
  | 'jump'
  | 'pounce'
  | 'bat'
  | 'stretch'
  | 'startle'
  | 'stalk'
  | 'groom'
  | 'scratch'
  | 'bellyUp'
  | 'sniff'
  | 'eat'
  | 'knead'
  | 'arch'
  | 'sleep'
  | 'hop'
  | 'wrestle'
  | 'cling'
  | 'peek'
  | 'beg'
  | 'reach'
  | 'flop'
  | 'tug'
  | 'purr'
  | 'dangle'

export type CatIntent =
  | 'wander'
  | 'explore'
  | 'play'
  | 'useProp'
  | 'hide'
  | 'socialize'
  | 'napping'
  | 'chaseBall'
  | 'carryBall'
  | 'fleeCursor'
  | 'teaseCursor'
  | 'passBall'
  | 'celebrate'
  | 'stashBall'
  | 'retrieveBall'
  | 'climb'
  | 'perch'
  | 'tunnelRun'
  | 'chaseButterfly'

export type CatBreed = 'tuxedo' | 'munchkin' | 'persian' | 'egyptianMau'

export type CoatPattern = 'tuxedo' | 'solid' | 'spotted' | 'bicolor'

export interface CatCoat {
  breed: CatBreed
  pattern: CoatPattern
  baseColor: string
  patchColor: string
  spotColor: string
  eyeColor: string
  fluffiness: number
  legLength: number
  whiteBib: number
  whiteSocks: [boolean, boolean, boolean, boolean]
  whiteMuzzle: boolean
  tailTip: boolean
  earNotch: boolean
  scale: number
}

export type CatEmote = 'startled' | 'curious' | 'love' | 'sleepy' | 'annoyed' | 'playful' | 'proud'

export type CatAction =
  | 'catchTreat'
  | 'missTreat'
  | 'catchToy'
  | 'missToy'
  | 'munch'
  | 'shakeOff'
  | 'purr'
  | 'catnipHigh'

export type LeapStyle = 'reach' | 'springUp' | 'twistReach' | 'doubleHop' | 'swat' | 'pounceHigh'

export interface CatState {
  id: string
  name: string
  position: Vec
  velocity: Vec
  height: number
  verticalSpeed: number
  facing: 1 | -1
  pose: CatPose
  intent: CatIntent
  intentTimer: number
  heldBallId: string | null
  propId: string | null
  hidden: boolean
  behavior: string
  emote: CatEmote | null
  emoteAge: number
  action: CatAction | null
  actionAge: number
  leapStyle: LeapStyle | null
  fullness: number
  affection: number
  gaze: Vec
  coat: CatCoat
  clock: number
  speedMultiplier: number
  followUntil: number | null
  acceleration: Vec
  launchedAt: number | null
  landedAt: number | null
  drowsiness?: number
  need?: CareItemKind | null
  needUrge?: number
  asleep?: boolean
  happiness?: number
  collar?: CatCollar | null
}

export interface CatCollar {
  color: string
  fittedAt: number
}

export type BallStatus = 'loose' | 'held' | 'stashed' | 'popped'

export interface BallState {
  id: string
  kind: BallKind
  position: Vec
  velocity: Vec
  height: number
  verticalSpeed: number
  spin: number
  status: BallStatus
  holderId: string | null
  stashPropId: string | null
  poppedAt: number | null
  thrownAt: number | null
}

export type PropKind =
  | 'catTree'
  | 'cardboardBox'
  | 'tunnel'
  | 'bench'
  | 'bush'
  | 'tree'
  | 'rock'
  | 'flowerBed'
  | 'pond'
  | 'picnicBlanket'
  | 'yarnBasket'
  | 'scratchingPost'
  | 'foodBowl'
  | 'lamppost'
  | 'feedingStation'
  | 'cushion'
  | ShopPropKind

export interface PropState {
  id: string
  kind: PropKind
  position: Vec
  radius: number
  solid: boolean
  perchHeight: number
  canStash: boolean
  variant: number
  occupantIds: string[]
  tunnelExit: Vec | null
  canHide: boolean
  agitation: number
  pokedAt: number | null
  lit: boolean
  foodLevel: number
  lift: number
  tilt: number
  droppedAt: number | null
  spawnedAt: number | null
}

export type EffectKind = 'leaves' | 'splash' | 'kibble' | 'petals' | 'dust' | 'sparkle' | 'yarn' | 'bounce' | 'hearts' | 'crumbs' | 'catnipPuff' | 'furTuft' | 'poof' | 'birds' | 'bubbles'

export interface WorldEffect {
  id: string
  kind: EffectKind
  position: Vec
  height: number
  time: number
  propId: string | null
  intensity: number
}

export interface ButterflyState {
  id: string
  position: Vec
  height: number
  heading: number
  hue: number
  clock: number
}

export interface PopEvent {
  id: string
  position: Vec
  time: number
}

export interface PointerState {
  position: Vec
  velocity: Vec
  active: boolean
  pressed: boolean
  tool: ToolKind
}

export interface World {
  width: number
  height: number
  time: number
  cats: CatState[]
  balls: BallState[]
  props: PropState[]
  butterflies: ButterflyState[]
  effects: WorldEffect[]
  heldToy: HeldToyState | null
  treats: TreatState[]
  catnip: CatnipPatch[]
  dayTime: number
  drag: DragState | null
  treatBagShake: TreatBagShake | null
  pops: PopEvent[]
  poppedCount: number
  care: CareState
  progress: ProgressState
  economy: EconomyState
  landscape: LandscapeState
}

export interface WorldConfig {
  width: number
  height: number
  catCount: number
  ballCount: number
  seed?: number
}
