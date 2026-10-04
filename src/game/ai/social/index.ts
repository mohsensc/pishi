import type { Behavior } from '../behavior'
import { shieldFromFarBalls } from '../play/shared/shield'
import { boxingMatchBehavior } from './boxingMatch'
import { cushionNapBehavior } from './cushionNap'
import { cushionPounceBehavior } from './cushionPounce'
import { followSummonerBehavior } from './followSummoner'
import { groomThenBiteBehavior } from './groomThenBite'
import { playBowInviteBehavior } from './playBowInvite'
import { spectateBehavior } from './spectate'
import { treatBagCallBehavior } from './treatBagCall'

const idleSocialBehaviors: Behavior[] = [boxingMatchBehavior, groomThenBiteBehavior, playBowInviteBehavior].map(shieldFromFarBalls)

export const socialBehaviors: Behavior[] = [
  ...idleSocialBehaviors,
  cushionNapBehavior,
  cushionPounceBehavior,
  followSummonerBehavior,
  treatBagCallBehavior,
  spectateBehavior,
]
