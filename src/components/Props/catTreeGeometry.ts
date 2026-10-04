import { CAT_TREE_LEVELS, CAT_TREE_PLATFORM_OFFSETS } from '../../game/constants'
import type { PropState } from '../../game/types'

interface CatTreePlatform {
  height: number
  offsetX: number
  width: number
}

const platformWidthRatios = [1.05, 1.05, 1.4]

export function catTreePlatforms(prop: PropState): CatTreePlatform[] {
  return CAT_TREE_LEVELS.map((heightRatio, index) => ({
    height: prop.perchHeight * heightRatio,
    offsetX: prop.radius * CAT_TREE_PLATFORM_OFFSETS[index],
    width: prop.radius * platformWidthRatios[index],
  }))
}
