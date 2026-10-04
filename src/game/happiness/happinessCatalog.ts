export const HAPPINESS_BASELINE = 0.45
export const HAPPINESS_DRIFT_PER_SECOND = 0.0006
export const WAITING_DECAY_PER_SECOND = 0.004
export const ASLEEP_WAITING_DECAY_PER_SECOND = 0.0035
export const PLAY_HAPPINESS_PER_SECOND = 0.014
export const AFFECTION_TO_HAPPINESS = 0.7
export const FEEDING_TO_HAPPINESS = 0.4
export const REQUEST_DELIGHT_HAPPINESS = 0.16
export const WRONG_GIFT_HAPPINESS = 0.03
export const COLLAR_HAPPINESS = 0.12
export const HAPPY_THRESHOLD = 0.72
export const UNHAPPY_THRESHOLD = 0.28
export const HAPPY_EMOTE_RATE = 1 / 12
export const UNHAPPY_EMOTE_RATE = 1 / 15

export const engagedBehaviorIds = new Set([
  'chaseLaser',
  'pounceLaser',
  'laserZoomies',
  'laserStalk',
  'gatherAround',
  'beg',
  'reachUp',
  'jumpForTreat',
  'jumpForToy',
  'swatAtToy',
  'sneakyApproach',
  'tugOfWar',
  'munchTreat',
  'carryToyAway',
  'comeForBrushing',
  'getBrushed',
  'getPetted',
  'presentBelly',
  'followCursor',
  'rubAgainstCursor',
  'approachCatnip',
  'catnipRoll',
  'catnipZoomies',
  'catnipKnead',
  'chaseBall',
  'fetchRace',
  'fetchReturn',
  'watchThrow',
  'enjoyCareItem',
  'approachOffer',
])
