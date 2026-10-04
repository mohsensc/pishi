import { createBreedCoat, createPersonality, lookForBreed, lookOfCoat, type Personality } from '../catalog'
import { createRandom, hashString } from '../random'
import type { CatBreed, CatCoat, CatState } from '../types'

const breedSizeFactors: Record<CatBreed, number> = {
  tuxedo: 1,
  munchkin: 0.92,
  persian: 1.08,
  egyptianMau: 1,
}

function breedSeed(cat: CatState, breed: CatBreed): number {
  return hashString(`${cat.id}:${breed}`)
}

export function previewBreedCoat(cat: CatState, breed: CatBreed): CatCoat {
  if (breed === cat.coat.breed) return cat.coat
  const look = lookForBreed(lookOfCoat(cat.coat), breed)
  const coat = createBreedCoat(breed, look, createRandom(breedSeed(cat, breed)), 1)
  const baseScale = cat.coat.scale / breedSizeFactors[cat.coat.breed]
  return { ...coat, scale: baseScale * breedSizeFactors[breed] }
}

export function personalityForBreed(cat: CatState, breed: CatBreed): Personality {
  return createPersonality(breed, createRandom(breedSeed(cat, breed) ^ 0x5bd1e995))
}
