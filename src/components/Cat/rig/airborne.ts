import { add } from '../../../game/vector'
import { leapAppliers } from './leapStyles'
import type { CatRig, RigInput } from './rigModel'
import { frontLegTotal, hindLegTotal, jointsOf, setPaws } from './rigModel'

export function applyPounce(rig: CatRig, input: RigInput): void {
  if (input.leapStyle && input.height > 2) {
    leapAppliers[input.leapStyle](rig, input)
    return
  }
  const { dimensions } = input
  rig.bodyAngle = 16
  rig.bodyStretch = 1.1
  rig.bodyY += 2
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.85, y: reach * 0.35 }),
    add(shoulder, { x: reach * 0.75, y: reach * 0.45 }),
    add(hip, { x: -hindReach * 0.75, y: hindReach * 0.4 }),
    add(hip, { x: -hindReach * 0.65, y: hindReach * 0.5 }),
  )
  rig.headOffsetX = 4
  rig.headOffsetY = 4
  rig.headAngle = -14
  rig.tailAngle = 150
  rig.tailCurl = -20
  rig.earAngle = 10
  rig.pupilDilation = 1
  rig.mouthOpen = 0.4
}

export function applyStartle(rig: CatRig, input: RigInput): void {
  const { dimensions, time } = input
  const quiver = Math.sin(time * 30) * 0.6
  rig.bodyAngle = -4
  rig.bodySquash = 1.08
  rig.bodyY -= 3
  rig.bodyArch = 0.2
  rig.furPuff = 0.8
  const { shoulder, hip } = jointsOf(rig, dimensions)
  const reach = frontLegTotal(dimensions)
  const hindReach = hindLegTotal(dimensions)
  setPaws(
    rig,
    add(shoulder, { x: reach * 0.35 + quiver, y: reach * 0.96 }),
    add(shoulder, { x: reach * 0.1, y: reach * 0.96 }),
    add(hip, { x: -hindReach * 0.3 - quiver, y: hindReach * 0.94 }),
    add(hip, { x: -hindReach * 0.05, y: hindReach * 0.96 }),
  )
  rig.headAngle = -6
  rig.headOffsetY = -2
  rig.tailAngle = 116
  rig.tailCurl = 30
  rig.tailPuff = 1
  rig.earAngle = -26
  rig.eyeOpen = 1
  rig.pupilDilation = 1
  rig.mouthOpen = 0.35
}
