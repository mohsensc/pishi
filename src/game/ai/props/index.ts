import type { Behavior } from '../behavior'
import { parkNovelty } from '../helpers/propUse'
import { batTreeToyBehavior } from './batTreeToy'
import { benchBackPerchBehavior } from './benchBackPerch'
import { benchNapBehavior } from './benchNap'
import { benchWeaveBehavior } from './benchWeave'
import { blanketKneadBehavior } from './blanketKnead'
import { blanketRollBehavior } from './blanketRoll'
import { boxHideBehavior } from './boxHide'
import { boxHopBehavior } from './boxHop'
import { bushAmbushBehavior } from './bushAmbush'
import { bushHideBehavior } from './bushHide'
import { canopyHideBehavior } from './canopyHide'
import { catTreeAscentBehavior } from './catTreeAscent'
import { drinkAtPondBehavior } from './drinkAtPond'
import { eatFromBowlBehavior } from './eatFromBowl'
import { fishWatchBehavior } from './fishWatch'
import { kingOfTheHillBehavior } from './kingOfTheHill'
import { lampLoungeBehavior } from './lampLounge'
import { lampRubBehavior } from './lampRub'
import { pawAtPondBehavior } from './pawAtPond'
import { postScratchBehavior } from './postScratch'
import { restByPropBehavior } from './restByProp'
import { rockSurveyBehavior } from './rockSurvey'
import { shadeNapBehavior } from './shadeNap'
import { sniffFlowersBehavior } from './sniffFlowers'
import { treeClimbBehavior } from './treeClimb'
import { trunkPeekBehavior } from './trunkPeek'
import { trunkScratchBehavior } from './trunkScratch'
import { tunnelPeekBehavior } from './tunnelPeek'
import { tunnelShuttleBehavior } from './tunnelShuttle'
import { yarnBasketSitBehavior } from './yarnBasketSit'
import { yarnChaseBehavior } from './yarnChase'
import { yarnPounceBehavior } from './yarnPounce'

const propAppeal = 2.2

function withAppeal(behavior: Behavior): Behavior {
  return {
    ...behavior,
    weight(cat, mind, context) {
      const base = behavior.weight(cat, mind, context)
      return base > 0 ? base * propAppeal * parkNovelty(behavior.id, context) : 0
    },
  }
}

export const propBehaviors: Behavior[] = [
  restByPropBehavior,
  benchNapBehavior,
  benchBackPerchBehavior,
  benchWeaveBehavior,
  shadeNapBehavior,
  treeClimbBehavior,
  canopyHideBehavior,
  trunkScratchBehavior,
  trunkPeekBehavior,
  bushHideBehavior,
  bushAmbushBehavior,
  boxHideBehavior,
  boxHopBehavior,
  tunnelShuttleBehavior,
  tunnelPeekBehavior,
  postScratchBehavior,
  eatFromBowlBehavior,
  drinkAtPondBehavior,
  pawAtPondBehavior,
  fishWatchBehavior,
  batTreeToyBehavior,
  catTreeAscentBehavior,
  kingOfTheHillBehavior,
  rockSurveyBehavior,
  sniffFlowersBehavior,
  blanketRollBehavior,
  blanketKneadBehavior,
  yarnChaseBehavior,
  yarnPounceBehavior,
  yarnBasketSitBehavior,
  lampRubBehavior,
  lampLoungeBehavior,
].map(withAppeal)
