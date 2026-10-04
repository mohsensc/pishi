import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import type { CareItemKind, Vec } from '../game/types'
import type { WorldActions } from './useWorld'

export interface CarePresenter {
  present: (kind: CareItemKind, clientPoint: Vec) => boolean
  probe: (clientPoint: Vec | null) => string | null
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

export function useCarePresenter(stageRef: RefObject<HTMLElement | null>, actions: WorldActions): CarePresenter {
  const markedRef = useRef<string | null>(null)

  const resolveCat = useCallback(
    (clientPoint: Vec): string | null => {
      const stage = stageRef.current
      if (!stage) return null
      const bounds = stage.getBoundingClientRect()
      const geometric = actions.careTargetAt({ x: clientPoint.x - bounds.left, y: clientPoint.y - bounds.top })
      return geometric ?? catIdFromDom(clientPoint)
    },
    [actions, stageRef],
  )

  const probe = useCallback(
    (clientPoint: Vec | null): string | null => {
      const catId = clientPoint ? resolveCat(clientPoint) : null
      if (catId !== markedRef.current) {
        markedRef.current = catId
        markTarget(stageRef.current, catId)
      }
      return catId
    },
    [resolveCat, stageRef],
  )

  const present = useCallback(
    (kind: CareItemKind, clientPoint: Vec): boolean => {
      const catId = resolveCat(clientPoint)
      probe(null)
      return catId !== null && actions.presentCareItem(catId, kind)
    },
    [actions, probe, resolveCat],
  )

  useEffect(() => () => markTarget(stageRef.current, null), [stageRef])

  return useMemo(() => ({ present, probe }), [present, probe])
}
