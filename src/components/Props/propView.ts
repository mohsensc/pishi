import type { CatCoat, PropState } from '../../game/types'

export interface PropViewProps {
  prop: PropState
  x: number
  y: number
  scale: number
  zIndex: number
  time: number
  occupantCoats?: CatCoat[]
}

export const groundZIndex = {
  pond: 2,
  picnicBlanket: 3,
  treeShade: 3,
  lightPool: 3,
  flowerBed: 4,
} as const

export const floorSquash = 0.42

export const contactShadowColor = 'rgba(38, 62, 24, 0.2)'

export interface PokeReaction {
  key: string
  poked: boolean
}

export function pokeReactionOf(prop: PropState): PokeReaction {
  if (prop.pokedAt === null) return { key: 'rest', poked: false }
  return { key: `poke${prop.pokedAt.toFixed(3)}`, poked: true }
}

export function reactionClass(reaction: PokeReaction, className: string): string | undefined {
  return reaction.poked ? className : undefined
}
