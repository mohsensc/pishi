import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { TrayItemKind, Vec } from '../game/types'
import type { WorldActions } from './useWorld'

export interface CarePresenter {
  present: (kind: TrayItemKind, clientPoint: Vec) => boolean
  probe: (clientPoint: Vec | null, kind?: TrayItemKind | null) => string | null
}

const targetAttribute = 'data-care-target'

function catIdFromDom(clientPoint: Vec): string | null {
  if (typeof document.elementsFromPoint !== 'function') return null
  const element = document.elementsFromPoint(clientPoint.x, clientPoint.y).find((candidate) => candidate.closest('[data-cat-id]') !== null)
  return element?.closest<HTMLElement>('[data-cat-id]')?.dataset.catId ?? null
}

function markTarget(stage: HTMLElement | null, catId: string | null): void {
  stage?.querySelectorAll(`[${targetAttribute}]`).forEach((element) => {
    if (element.getAttribute('data-cat-id') !== catId) element.removeAttribute(targetAttribute)
  })
  if (!stage || !catId) return
  stage.querySelector(`[data-cat-id="${CSS.escape(catId)}"]`)?.setAttribute(targetAttribute, 'true')
}

export function useCarePresenter(stageRef: RefObject<HTMLElement | null>, actions: WorldActions, onCollarFitted: (catId: string) => void): CarePresenter {
  const markedRef = useRef<string | null>(null)

  const stagePoint = useCallback(
    (clientPoint: Vec): Vec | null => {
      const stage = stageRef.current
      if (!stage) return null
      const bounds = stage.getBoundingClientRect()
      return { x: clientPoint.x - bounds.left, y: clientPoint.y - bounds.top }
    },
    [stageRef],
  )

  const resolveCat = useCallback(
    (clientPoint: Vec, kind: TrayItemKind | null): string | null => {
      const point = stagePoint(clientPoint)
      if (!point) return null
      return actions.careTargetAt(point, kind) ?? catIdFromDom(clientPoint)
    },
    [actions, stagePoint],
  )

  const probe = useCallback(
    (clientPoint: Vec | null, kind: TrayItemKind | null = null): string | null => {
      const catId = clientPoint ? resolveCat(clientPoint, kind) : null
      actions.offerCareItem(clientPoint ? kind : null, clientPoint ? stagePoint(clientPoint) : null)
      if (catId !== markedRef.current) {
        markedRef.current = catId
        markTarget(stageRef.current, catId)
      }
      return catId
    },
    [actions, resolveCat, stagePoint, stageRef],
  )

  const present = useCallback(
    (kind: TrayItemKind, clientPoint: Vec): boolean => {
      const catId = resolveCat(clientPoint, kind)
      probe(null)
      if (catId === null) return false
      if (kind !== 'collar') return actions.presentCareItem(catId, kind)
      if (!actions.fitCollar(catId)) return false
      onCollarFitted(catId)
      return true
    },
    [actions, onCollarFitted, probe, resolveCat],
  )

  useEffect(() => () => markTarget(stageRef.current, null), [stageRef])

  return useMemo(() => ({ present, probe }), [present, probe])
}
