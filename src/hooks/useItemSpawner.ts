import { useCallback, type RefObject } from 'react'
import type { SpawnableItem, Vec } from '../game/types'
import type { WorldActions } from './useWorld'

function defaultDropPoint(stage: HTMLElement): Vec {
  return {
    x: stage.clientWidth * (0.5 + (Math.random() - 0.5) * 0.3),
    y: stage.clientHeight * (0.66 + (Math.random() - 0.5) * 0.12),
  }
}

export function useItemSpawner(stageRef: RefObject<HTMLElement | null>, actions: WorldActions): (item: SpawnableItem, clientPoint: Vec | null) => boolean {
  return useCallback(
    (item, clientPoint) => {
      const stage = stageRef.current
      if (!stage) return false
      const bounds = stage.getBoundingClientRect()
      const point = clientPoint ? { x: clientPoint.x - bounds.left, y: clientPoint.y - bounds.top } : defaultDropPoint(stage)
      const spawned = item.category === 'prop' ? actions.spawnProp(item.kind, point) : actions.spawnLooseToy(item.kind, point)
      return spawned !== null
    },
    [actions, stageRef],
  )
}
