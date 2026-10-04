import type { CatPose, CatState } from '../../../game/types'
import { FidgetScheduler } from './fidgets'
import type { CatRig, RigInput } from './rigModel'
import { clampRange, createPulseRandom, envelope, Spring } from './springs'

const restingPoses = new Set<CatPose>(['sit', 'loaf', 'beg', 'crouch', 'eat', 'sniff', 'peek', 'groom', 'purr', 'knead', 'sleep'])
const breathingPoses = new Set<CatPose>(['sit', 'beg', 'crouch', 'eat', 'sniff', 'peek', 'reach', 'tug', 'bat', 'scratch'])
const leaningPoses = new Set<CatPose>(['walk', 'run', 'stalk', 'crouch', 'hop', 'sniff', 'arch', 'startle'])
const unclampedPoses = new Set<CatPose>(['cling', 'dangle'])
const maxBodyAngle = 32
const velocitySmoothing = 10

interface MotionReading {
  forwardSpeed: number
  forwardAcceleration: number
  depthAcceleration: number
  airborne: boolean
}

export class SecondaryMotion {
  private readonly random: () => number
  private readonly fidgets: FidgetScheduler
  private readonly lean = new Spring(140, 20)
  private readonly headLead = new Spring(90, 14)
  private readonly tail = new Spring(55, 4.5)
  private readonly swing = new Spring(26, 2.6)
  private readonly landing = new Spring(300, 15)
  private readonly takeoff = new Spring(220, 16)
  private readonly turn = new Spring(260, 18)
  private lastLandedAt: number | null = null
  private lastLaunchedAt: number | null = null
  private lastFacing: 1 | -1 | null = null
  private lastPosition: { x: number; y: number } | null = null
  private screenVelocity = { x: 0, y: 0 }
  private screenAcceleration = { x: 0, y: 0 }
  private lastVerticalSpeed = 0
  private exertion = 0
  private breathPhase = 0
  private earFlickTimer = 2
  private earFlickAge = 9
  private earFlickSide: 1 | -1 = 1
  private whiskerTimer = 1
  private whiskerAge = 9

  constructor(seed: number) {
    this.random = createPulseRandom(seed)
    this.fidgets = new FidgetScheduler(this.random)
  }

  get swingAngle(): number {
    return this.swing.value
  }

  private trackScreenMotion(cat: CatState, seconds: number): void {
    const position = { x: cat.position.x, y: cat.position.y - cat.height }
    if (this.lastPosition && seconds > 0) {
      const blend = 1 - Math.exp(-velocitySmoothing * seconds)
      const measured = { x: (position.x - this.lastPosition.x) / seconds, y: (position.y - this.lastPosition.y) / seconds }
      const previous = this.screenVelocity
      this.screenVelocity = { x: previous.x + (measured.x - previous.x) * blend, y: previous.y + (measured.y - previous.y) * blend }
      const change = { x: (this.screenVelocity.x - previous.x) / seconds, y: (this.screenVelocity.y - previous.y) / seconds }
      this.screenAcceleration = {
        x: this.screenAcceleration.x + (change.x - this.screenAcceleration.x) * blend,
        y: this.screenAcceleration.y + (change.y - this.screenAcceleration.y) * blend,
      }
    }
    this.lastPosition = position
  }

  private detectEvents(cat: CatState): void {
    if (cat.landedAt !== this.lastLandedAt) {
      if (this.lastLandedAt !== null || cat.landedAt !== null) {
        const impact = clampRange(Math.abs(this.lastVerticalSpeed) / 380, 0.45, 1.3)
        this.landing.kick(-5.2 * impact)
        this.tail.kick(-180 * impact)
      }
      this.lastLandedAt = cat.landedAt
    }
    if (cat.launchedAt !== this.lastLaunchedAt) {
      if (this.lastLaunchedAt !== null || cat.launchedAt !== null) this.takeoff.kick(5)
      this.lastLaunchedAt = cat.launchedAt
    }
    if (this.lastFacing !== null && cat.facing !== this.lastFacing) {
      this.turn.kick(-7)
      this.tail.kick(140)
    }
    this.lastFacing = cat.facing
  }

  private read(cat: CatState): MotionReading {
    const dangling = cat.pose === 'dangle'
    const velocityX = dangling ? this.screenVelocity.x : cat.velocity.x
    const accelerationX = dangling ? this.screenAcceleration.x : cat.acceleration.x
    return {
      forwardSpeed: velocityX * cat.facing,
      forwardAcceleration: accelerationX * cat.facing,
      depthAcceleration: dangling ? this.screenAcceleration.y : cat.acceleration.y,
      airborne: cat.height > 1.5 && !dangling,
    }
  }

  private updatePulses(seconds: number): void {
    this.earFlickTimer -= seconds
    this.earFlickAge += seconds
    if (this.earFlickTimer <= 0) {
      this.earFlickTimer = 1.8 + this.random() * 4.5
      this.earFlickAge = 0
      this.earFlickSide = this.random() < 0.6 ? 1 : -1
    }
    this.whiskerTimer -= seconds
    this.whiskerAge += seconds
    if (this.whiskerTimer <= 0) {
      this.whiskerTimer = 0.9 + this.random() * 2.6
      this.whiskerAge = 0
    }
  }

  update(cat: CatState, seconds: number): void {
    this.trackScreenMotion(cat, seconds)
    this.detectEvents(cat)
    this.lastVerticalSpeed = cat.verticalSpeed
    if (seconds <= 0) return
    const reading = this.read(cat)
    const speed = Math.hypot(cat.velocity.x, cat.velocity.y)
    const exertionTarget = clampRange(speed / 260, 0, 1)
    this.exertion += (exertionTarget - this.exertion) * (1 - Math.exp(-(exertionTarget > this.exertion ? 1.2 : 0.18) * seconds))
    this.breathPhase = (this.breathPhase + seconds * (1.5 + this.exertion * 4.5) * Math.PI * 2) % (Math.PI * 200)
    const grounded = !reading.airborne && cat.pose !== 'dangle'
    const leaning = grounded && leaningPoses.has(cat.pose)
    this.lean.step(leaning ? clampRange(reading.forwardAcceleration / 115, -11, 8) : 0, seconds)
    this.headLead.step(clampRange(reading.forwardSpeed / 90, -2, 3.2) + clampRange(reading.depthAcceleration / 160, -5, 5), seconds)
    const tailTarget = reading.airborne ? clampRange(cat.verticalSpeed * 0.06, -40, 40) : clampRange(reading.forwardAcceleration * 0.03, -35, 35)
    const tailDrive = cat.pose === 'dangle' ? clampRange(reading.forwardAcceleration * 0.05, -40, 40) : tailTarget
    this.tail.step(tailDrive, seconds)
    this.swing.step(cat.pose === 'dangle' ? clampRange(reading.forwardAcceleration * 0.035, -34, 34) : 0, seconds)
    this.landing.step(0, seconds)
    this.takeoff.step(0, seconds)
    this.turn.step(0, seconds)
    const calm = speed < 10 && grounded && cat.intent !== 'napping'
    const tailImpulse = this.fidgets.update(seconds, cat.pose, calm)
    if (tailImpulse !== 0) this.tail.kick(tailImpulse)
    this.updatePulses(seconds)
  }

  apply(rig: CatRig, input: RigInput): void {
    const { pose } = input
    const resting = restingPoses.has(pose)
    rig.bodyAngle += this.lean.value
    if (this.lean.value < -3 && (pose === 'walk' || pose === 'run' || pose === 'crouch')) {
      const plant = -this.lean.value * 0.45
      rig.frontNearX += plant
      rig.frontFarX += plant
    }
    rig.headAngle -= this.lean.value * 0.45
    rig.headOffsetX += resting ? 0 : this.headLead.value
    rig.tailAngle += this.tail.value
    rig.tailCurl += this.tail.velocity * 0.09
    const squash = this.landing.value
    rig.bodySquash *= 1 + squash * 0.7
    rig.bodyStretch *= 1 - squash * 0.4
    rig.bodyY -= squash * 10
    rig.bodyStretch *= 1 + this.takeoff.value * 0.5
    rig.bodySquash *= 1 - this.takeoff.value * 0.3
    rig.bodyStretch *= 1 + this.turn.value * 0.4
    rig.headOffsetX += this.turn.value * 6
    if (breathingPoses.has(pose)) {
      const breath = Math.sin(this.breathPhase) * (0.016 + this.exertion * 0.03)
      rig.bodySquash *= 1 + breath
      rig.headOffsetY += breath * 12
      if (this.exertion > 0.45) rig.mouthOpen = Math.max(rig.mouthOpen, (this.exertion - 0.45) * 0.5)
    }
    this.fidgets.apply(rig, input)
    const flick = envelope(this.earFlickAge / 0.24) * (pose === 'sleep' ? 9 : 22)
    if (this.earFlickSide > 0) rig.earFlickNear += flick
    else rig.earFlickFar -= flick
    const twitch = envelope(this.whiskerAge / 0.3) * Math.sin(this.whiskerAge * 60) * 7
    const sniffing = pose === 'sniff' || pose === 'eat' ? Math.sin(input.time * 24) * 5 : 0
    rig.whiskerTwitch += twitch + sniffing
    if (!unclampedPoses.has(pose)) rig.bodyAngle = clampRange(rig.bodyAngle, -maxBodyAngle, maxBodyAngle)
  }
}
