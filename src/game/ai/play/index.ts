import type { Behavior } from '../behavior'
import { shieldFromFarBalls } from './shared/shield'
import { ambushBehavior } from './ambush'
import { ballParadeBehavior } from './ballParade'
import { bellyCrawlBehavior } from './bellyCrawl'
import { bellyUpWiggleBehavior } from './bellyUpWiggle'
import { bunnyHopsBehavior } from './bunnyHops'
import { butterflyBalletBehavior } from './butterflyBallet'
import { circleBallBehavior } from './circleBall'
import { circleSettleBehavior } from './circleSettle'
import { crabWalkBehavior } from './crabWalk'
import { cuddlePileBehavior } from './cuddlePile'
import { curiousApproachBehavior } from './curiousApproach'
import { dribbleBallBehavior } from './dribbleBall'
import { dustBathBehavior } from './dustBath'
import { fetchRaceBehavior } from './fetch'
import { fetchReturnBehavior } from './fetchReturn'
import { figureEightBehavior } from './figureEight'
import { followLeaderBehavior } from './followLeader'
import { grassBugHuntBehavior } from './grassBugHunt'
import { groomSelfBehavior } from './groomSelf'
import { headbuttRubBehavior } from './headbuttRub'
import { imaginaryBugPounceBehavior } from './imaginaryBugPounce'
import { keepyUpBehavior } from './keepyUp'
import { kneadGrassBehavior } from './kneadGrass'
import { lapZoomiesBehavior } from './lapZoomies'
import { leapfrogBehavior } from './leapfrog'
import { loafInSunBehavior } from './loafInSun'
import { midnightSprintBehavior } from './midnightSprint'
import { mirrorCursorBehavior } from './mirrorCursor'
import { mutualGroomingBehavior } from './mutualGrooming'
import { noseBoopBehavior } from './noseBoop'
import { orbitCursorBehavior } from './orbitCursor'
import { pacingBehavior } from './pacing'
import { patrolPerimeterBehavior } from './patrolPerimeter'
import { phantomSpookBehavior } from './phantomSpook'
import { pinballBounceBehavior } from './pinballBounce'
import { pounceDanceBehavior } from './pounceDance'
import { pounceOnFriendBehavior } from './pounceOnFriend'
import { racePairBehavior } from './racePair'
import { relayChainBehavior } from './relayChain'
import { shadowChaseBehavior } from './shadowChase'
import { slowBlinkBehavior } from './slowBlink'
import { sneakBehindCursorBehavior } from './sneakBehindCursor'
import { sniffAroundBehavior } from './sniffAround'
import { sniffTrailBehavior } from './sniffTrail'
import { spiralInOutBehavior } from './spiralInOut'
import { stopAndGoStalkBehavior } from './stopAndGoStalk'
import { stretchYawnBehavior } from './stretchYawn'
import { swatAtAirBehavior } from './swatAtAir'
import { syncStareBehavior } from './syncStare'
import { tagBehavior } from './tag'
import { tailChaseBehavior } from './tailChase'
import { watchBirdsBehavior } from './watchBirds'
import { wrestlePairBehavior } from './wrestlePair'
import { zigzagSprintBehavior } from './zigzagSprint'

const playLibrary: Behavior[] = [
  ambushBehavior,
  ballParadeBehavior,
  bellyCrawlBehavior,
  bellyUpWiggleBehavior,
  bunnyHopsBehavior,
  butterflyBalletBehavior,
  circleBallBehavior,
  circleSettleBehavior,
  crabWalkBehavior,
  cuddlePileBehavior,
  curiousApproachBehavior,
  dribbleBallBehavior,
  dustBathBehavior,
  fetchRaceBehavior,
  fetchReturnBehavior,
  figureEightBehavior,
  followLeaderBehavior,
  grassBugHuntBehavior,
  groomSelfBehavior,
  headbuttRubBehavior,
  imaginaryBugPounceBehavior,
  keepyUpBehavior,
  kneadGrassBehavior,
  lapZoomiesBehavior,
  leapfrogBehavior,
  loafInSunBehavior,
  midnightSprintBehavior,
  mirrorCursorBehavior,
  mutualGroomingBehavior,
  noseBoopBehavior,
  orbitCursorBehavior,
  pacingBehavior,
  patrolPerimeterBehavior,
  phantomSpookBehavior,
  pinballBounceBehavior,
  pounceDanceBehavior,
  pounceOnFriendBehavior,
  racePairBehavior,
  relayChainBehavior,
  shadowChaseBehavior,
  slowBlinkBehavior,
  sneakBehindCursorBehavior,
  sniffAroundBehavior,
  sniffTrailBehavior,
  spiralInOutBehavior,
  stopAndGoStalkBehavior,
  stretchYawnBehavior,
  swatAtAirBehavior,
  syncStareBehavior,
  tagBehavior,
  tailChaseBehavior,
  watchBirdsBehavior,
  wrestlePairBehavior,
  zigzagSprintBehavior,
]

export const playBehaviors: Behavior[] = playLibrary.map(shieldFromFarBalls)
