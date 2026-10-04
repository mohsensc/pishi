import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { DRAG_START_DISTANCE } from '../game/constants'
import { distance } from '../game/vector'
import type { DragHit, PointerState, Vec } from '../game/types'
import type { WorldActions } from './useWorld'
import { catIdAt, isInterfaceElement, isOverDiscardZone, paintedElementAt, pokeAt, resolvePressHit } from './dragGesture/pressTargets'

interface PressRecord {
  pointerId: number
  touch: boolean
  start: Vec
  element: Element | null
  hit: DragHit | null
  moved: boolean
}

type StagePointerEvent = ReactPointerEvent<HTMLDivElement>

export interface DragGesture {
  onPointerDown: (event: StagePointerEvent) => void
  onPointerMove: (event: StagePointerEvent) => void
  onPointerUp: (event: StagePointerEvent) => void
  onPointerCancel: (event: StagePointerEvent) => void
  overDiscard: boolean
}

function stagePointOf(event: StagePointerEvent): Vec {
  const bounds = event.currentTarget.getBoundingClientRect()
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

function isDiscardable(hit: DragHit | null): boolean {
  return hit !== null && (hit.target === 'prop' || hit.target === 'ball')
}

export function useDragGesture(actions: WorldActions, pointerRef: RefObject<PointerState>, enabled: boolean, onCatTap?: (catId: string) => void): DragGesture {
  const pressRef = useRef<PressRecord | null>(null)
  const [overDiscard, setOverDiscard] = useState(false)

  const pointerVelocity = useCallback((): Vec => {
    const velocity = pointerRef.current.velocity
    return { x: velocity.x, y: velocity.y }
  }, [pointerRef])

  const finishPress = useCallback(
    (event: StagePointerEvent) => {
      pressRef.current = null
      actions.setBallCatching(false)
      actions.guardBall(null)
      setOverDiscard(false)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    },
    [actions],
  )

  const onPointerDown = useCallback(
    (event: StagePointerEvent) => {
      const element = paintedElementAt(event.target, event.clientX, event.clientY)
      if (!enabled || isInterfaceElement(element) || (event.pointerType === 'mouse' && event.button !== 0)) return
      const point = stagePointOf(event)
      const touch = event.pointerType !== 'mouse'
      const hit = resolvePressHit(element, point, actions)
      pressRef.current = { pointerId: event.pointerId, touch, start: point, element, hit, moved: false }
      if (!touch) actions.setBallCatching(true)
      if (hit?.target !== 'ball') return
      if (touch) actions.guardBall(hit.id)
      else actions.beginDrag('ball', hit.id, point)
    },
    [actions, enabled],
  )

  const onPointerMove = useCallback(
    (event: StagePointerEvent) => {
      const press = pressRef.current
      if (!press || press.pointerId !== event.pointerId) return
      const point = stagePointOf(event)
      if (!press.moved && distance(point, press.start) > DRAG_START_DISTANCE) {
        press.moved = true
        actions.guardBall(null)
        if (press.hit && !actions.currentDrag()) actions.beginDrag(press.hit.target, press.hit.id, press.start)
        if (actions.currentDrag() && !event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
      }
      actions.updateDrag(point, pointerVelocity())
      const discarding = isDiscardable(actions.currentDrag()) && isOverDiscardZone(event.clientX, event.clientY)
      setOverDiscard((previous) => (previous === discarding ? previous : discarding))
    },
    [actions, pointerVelocity],
  )

  const onPointerUp = useCallback(
    (event: StagePointerEvent) => {
      const press = pressRef.current
      if (!press || press.pointerId !== event.pointerId) return
      const point = stagePointOf(event)
      const drag = actions.currentDrag()
      if (drag) {
        if (isDiscardable(drag) && isOverDiscardZone(event.clientX, event.clientY)) actions.discardDrag()
        else actions.endDrag(point, pointerVelocity())
      } else if (!press.moved) {
        if (press.touch && press.hit?.target === 'ball') actions.tapBall(press.hit.id)
        else {
          pokeAt(press.element, point, actions)
          const catId = catIdAt(press.element) ?? (press.hit?.target === 'cat' ? press.hit.id : null)
          if (catId && onCatTap) onCatTap(catId)
        }
      }
      finishPress(event)
    },
    [actions, finishPress, onCatTap, pointerVelocity],
  )

  const onPointerCancel = useCallback(
    (event: StagePointerEvent) => {
      const press = pressRef.current
      if (!press || press.pointerId !== event.pointerId) return
      actions.endDrag(stagePointOf(event), { x: 0, y: 0 })
      finishPress(event)
    },
    [actions, finishPress],
  )

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, overDiscard }
}
