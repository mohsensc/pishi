import { useState } from 'react'
import { CAT_CARD_DELAY } from '../game/constants'
import { depthScale, toScreen } from '../game/projection'
import { distance } from '../game/vector'
import type { CatState, PointerState, World } from '../game/types'

interface HoverRecord {
  catId: string | null
  since: number
}

const pickReach = 34
const keepReach = 58

function reachOf(cat: CatState, world: World, pointer: PointerState): number {
  const scale = cat.coat.scale * depthScale(cat.position.y, world.height)
  return distance(toScreen(cat.position, cat.height + 18 * scale), pointer.position) / scale
}

function catUnderPointer(world: World, pointer: PointerState, currentId: string | null): CatState | null {
  if (!pointer.active) return null
  const current = world.cats.find((cat) => cat.id === currentId && !cat.hidden)
  if (current && reachOf(current, world, pointer) < keepReach) return current
  let best: CatState | null = null
  let bestGap = Number.POSITIVE_INFINITY
  for (const cat of world.cats) {
    if (cat.hidden) continue
    const gap = reachOf(cat, world, pointer)
    if (gap < pickReach && gap < bestGap) {
      best = cat
      bestGap = gap
    }
  }
  return best
}

export function useCatHover(world: World, pointer: PointerState, suppressed: boolean): CatState | null {
  const [record, setRecord] = useState<HoverRecord>({ catId: null, since: 0 })
  const hovered = suppressed ? null : catUnderPointer(world, pointer, record.catId)
  const hoveredId = hovered?.id ?? null

  if (hoveredId !== record.catId) {
    setRecord({ catId: hoveredId, since: world.time })
    return null
  }
  if (!hovered) return null
  return world.time - record.since >= CAT_CARD_DELAY ? hovered : null
}
