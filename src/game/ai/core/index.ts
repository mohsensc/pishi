import type { Behavior } from '../behavior'
import { carryBallBehavior } from './carryBall'
import { celebrateBehavior } from './celebrate'
import { chaseBallBehavior } from './chaseBall'
import { chaseButterflyBehavior } from './chaseButterfly'
import { climbBehavior } from './climb'
import { fleeCursorBehavior } from './fleeCursor'
import { investigateSpotBehavior } from './investigateSpot'
import { nappingBehavior } from './napping'
import { passBallBehavior } from './passBall'
import { perchBehavior } from './perch'
import { sitIdleBehavior } from './restIdle'
import { retrieveBallBehavior } from './retrieveBall'
import { stashBallBehavior } from './stashBall'
import { strollBehavior } from './stroll'
import { stretchIdleBehavior } from './stretchIdle'
import { teaseCursorBehavior } from './teaseCursor'
import { tunnelRunBehavior } from './tunnelRun'
import { visitPropBehavior } from './visitProp'
import { zoomiesBehavior } from './zoomies'

export const coreBehaviors: Behavior[] = [
  strollBehavior,
  visitPropBehavior,
  sitIdleBehavior,
  stretchIdleBehavior,
  zoomiesBehavior,
  nappingBehavior,
  chaseBallBehavior,
  carryBallBehavior,
  fleeCursorBehavior,
  teaseCursorBehavior,
  passBallBehavior,
  stashBallBehavior,
  retrieveBallBehavior,
  climbBehavior,
  perchBehavior,
  tunnelRunBehavior,
  chaseButterflyBehavior,
  celebrateBehavior,
  investigateSpotBehavior,
]
