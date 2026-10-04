import { pokeReactionOf, type PokeReaction } from '../Props/propView'
import type { PropState } from '../../game/types'

export const baseRadii: Record<string, number> = {
  fountain: 46,
  birdbath: 18,
  pinwheel: 9,
  springToy: 12,
  birdFeeder: 14,
  swing: 40,
  butterflyHouse: 16,
  sprinkler: 12,
  windmill: 30,
  bubbleMachine: 16,
}

export function sizeFactorOf(prop: PropState): number {
  return Math.min(1.25, Math.max(0.55, prop.radius / (baseRadii[prop.kind] ?? prop.radius)))
}

export function pokeOf(prop: PropState): PokeReaction {
  return pokeReactionOf(prop)
}

export function seeded(prop: PropState, salt: number): number {
  let hash = salt * 2654435761
  for (let index = 0; index < prop.id.length; index += 1) hash = Math.imul(hash ^ prop.id.charCodeAt(index), 16777619)
  return ((hash >>> 0) % 1000) / 1000
}

export const stoneTones = { light: '#e3ddcf', mid: '#cfc7b4', dark: '#b5ab95', shade: '#9d937d' }
export const waterTones = { light: '#bfe6ee', mid: '#8cc7d8', deep: '#5fa9c0', foam: '#f2fbfc' }
export const woodTones = { light: '#c99a66', mid: '#b07f4d', dark: '#8a5c3b' }
