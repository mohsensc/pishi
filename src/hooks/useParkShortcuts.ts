import { useEffect, type RefObject } from 'react'
import { DRAG_START_DISTANCE } from '../game/constants'
import type { PointerState, Vec } from '../game/types'
import type { WorldActions } from './useWorld'

interface TapRecord {
  time: number
  point: Vec
  catId: string
}

const doubleTapWindowMs = 340
const doubleTapSlop = 30
const interfaceSelector = 'button, [data-ui]'

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function localPoint(stage: HTMLElement, event: PointerEvent): Vec {
  const bounds = stage.getBoundingClientRect()
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
}

function tappedCatId(event: PointerEvent, point: Vec, actions: WorldActions): string | null {
  const element = event.target instanceof Element ? event.target : null
  const fromElement = element?.closest<HTMLElement>('[data-cat-id]')?.dataset.catId
  if (fromElement) return fromElement
  const underPointer = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(event.clientX, event.clientY) : []
  const painted = underPointer.find((candidate) => candidate.closest('[data-cat-id]') !== null)
  const fromPainted = painted?.closest<HTMLElement>('[data-cat-id]')?.dataset.catId
  if (fromPainted) return fromPainted
  const hit = actions.hitTestDraggable(point)
  return hit?.target === 'cat' ? hit.id : null
}

export function useParkShortcuts(stageRef: RefObject<HTMLElement | null>, pointerRef: RefObject<PointerState>, actions: WorldActions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      const stage = stageRef.current
      if (!stage) return
      const pointer = pointerRef.current
      const fallback = { x: stage.clientWidth / 2, y: stage.clientHeight * 0.62 }
      actions.shakeTreatBag(pointer.active ? { x: pointer.position.x, y: pointer.position.y } : fallback)
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && event.target instanceof HTMLButtonElement) event.preventDefault()
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [actions, pointerRef, stageRef])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let pressPoint: Vec | null = null
    let lastTap: TapRecord | null = null

    const handleDown = (event: PointerEvent) => {
      const overInterface = event.target instanceof Element && event.target.closest(interfaceSelector) !== null
      pressPoint = overInterface ? null : localPoint(stage, event)
    }

    const handleUp = (event: PointerEvent) => {
      const start = pressPoint
      pressPoint = null
      if (!start) return
      const point = localPoint(stage, event)
      if (Math.hypot(point.x - start.x, point.y - start.y) > DRAG_START_DISTANCE) {
        lastTap = null
        return
      }
      const previous = lastTap
      const isDouble =
        previous !== null &&
        event.timeStamp - previous.time < doubleTapWindowMs &&
        Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < doubleTapSlop
      if (previous && isDouble) {
        actions.summonCat(previous.catId, point)
        lastTap = null
        return
      }
      const catId = tappedCatId(event, point, actions)
      lastTap = catId ? { time: event.timeStamp, point, catId } : null
    }

    stage.addEventListener('pointerdown', handleDown)
    stage.addEventListener('pointerup', handleUp)
    return () => {
      stage.removeEventListener('pointerdown', handleDown)
      stage.removeEventListener('pointerup', handleUp)
    }
  }, [actions, stageRef])
}
