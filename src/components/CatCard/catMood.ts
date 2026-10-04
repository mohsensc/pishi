import type { CatEmote, CatState } from '../../game/types'

export type CatMood = 'sleepy' | 'hungry' | 'grumpy' | 'playful' | 'loving' | 'curious' | 'content'

const playfulIntents = new Set(['play', 'chaseBall', 'carryBall', 'teaseCursor', 'passBall', 'chaseButterfly', 'celebrate'])

export function moodOf(cat: CatState): CatMood {
  if (cat.pose === 'sleep' || cat.intent === 'napping') return 'sleepy'
  if (cat.emote === 'annoyed' || cat.pose === 'arch') return 'grumpy'
  if (cat.fullness < 0.25) return 'hungry'
  if (playfulIntents.has(cat.intent) || cat.emote === 'playful') return 'playful'
  if (cat.affection > 0.65 || cat.emote === 'love' || cat.pose === 'purr') return 'loving'
  if (cat.intent === 'explore' || cat.emote === 'curious') return 'curious'
  return 'content'
}

export const moodEmotes: Partial<Record<CatMood, CatEmote>> = {
  sleepy: 'sleepy',
  grumpy: 'annoyed',
  playful: 'playful',
  loving: 'love',
  curious: 'curious',
}

export const moodLabels: Record<CatMood, string> = {
  sleepy: 'Sleepy',
  hungry: 'Hungry',
  grumpy: 'Grumpy',
  playful: 'Playful',
  loving: 'Affectionate',
  curious: 'Curious',
  content: 'Content',
}
