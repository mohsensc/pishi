import { useEffect, useRef, type RefObject } from 'react'
import { createIdlePointer } from '../game/pointer'
import type { PointerState } from '../game/types'
import { useAnimationFrame } from './useAnimationFrame'

const velocitySmoothing = 0.35
const velocityDecayRate = 9
const idleThresholdMs = 40
const minimumPressMs = 70
const interfaceSelector = 'button, [data-ui]'

function isOverInterface(event: PointerEvent): boolean {
  return event.target instanceof Element && event.target.closest(interfaceSelector) !== null
}

export function usePointer(targetRef: RefObject<HTMLElement | null>): RefObject<PointerState> {
  const pointerRef = useRef<PointerState>(createIdlePointer())
  const lastMoveTimeRef = useRef(0)
  const pressStartRef = useRef(0)
  const releaseTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    const readLocalPosition = (event: PointerEvent) => {
      const bounds = target.getBoundingClientRect()
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
    }

    const trackPosition = (event: PointerEvent) => {
      const pointer = pointerRef.current
      if (isOverInterface(event)) {
        pointer.active = false
        pointer.velocity.x = 0
        pointer.velocity.y = 0
        return
      }
      const nextPosition = readLocalPosition(event)
      const now = event.timeStamp
      const elapsedSeconds = Math.max((now - lastMoveTimeRef.current) / 1000, 1 / 240)
      if (pointer.active && elapsedSeconds < 0.25) {
        const instantVelocityX = (nextPosition.x - pointer.position.x) / elapsedSeconds
        const instantVelocityY = (nextPosition.y - pointer.position.y) / elapsedSeconds
        pointer.velocity.x += (instantVelocityX - pointer.velocity.x) * velocitySmoothing
        pointer.velocity.y += (instantVelocityY - pointer.velocity.y) * velocitySmoothing
      } else {
        pointer.velocity.x = 0
        pointer.velocity.y = 0
      }
      pointer.position.x = nextPosition.x
      pointer.position.y = nextPosition.y
      pointer.active = true
      lastMoveTimeRef.current = now
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isOverInterface(event)) return
      cancelPendingRelease()
      trackPosition(event)
      pressStartRef.current = event.timeStamp
      pointerRef.current.pressed = true
      if (event.pointerType !== 'mouse') target.setPointerCapture(event.pointerId)
    }

    const cancelPendingRelease = () => {
      if (releaseTimerRef.current === null) return
      window.clearTimeout(releaseTimerRef.current)
      releaseTimerRef.current = null
    }

    const release = (touch: boolean) => {
      releaseTimerRef.current = null
      pointerRef.current.pressed = false
      if (!touch) return
      pointerRef.current.active = false
      pointerRef.current.velocity.x = 0
      pointerRef.current.velocity.y = 0
    }

    const handlePointerUp = (event: PointerEvent) => {
      const touch = event.pointerType !== 'mouse'
      const remaining = minimumPressMs - (event.timeStamp - pressStartRef.current)
      cancelPendingRelease()
      if (remaining <= 0) {
        release(touch)
        return
      }
      releaseTimerRef.current = window.setTimeout(() => release(touch), remaining)
    }

    const handlePointerLeave = () => {
      pointerRef.current.active = false
      pointerRef.current.pressed = false
      pointerRef.current.velocity.x = 0
      pointerRef.current.velocity.y = 0
    }

    target.addEventListener('pointermove', trackPosition)
    target.addEventListener('pointerdown', handlePointerDown)
    target.addEventListener('pointerup', handlePointerUp)
    target.addEventListener('pointercancel', handlePointerLeave)
    target.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('blur', handlePointerLeave)

    return () => {
      cancelPendingRelease()
      target.removeEventListener('pointermove', trackPosition)
      target.removeEventListener('pointerdown', handlePointerDown)
      target.removeEventListener('pointerup', handlePointerUp)
      target.removeEventListener('pointercancel', handlePointerLeave)
      target.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('blur', handlePointerLeave)
    }
  }, [targetRef])

  useAnimationFrame((deltaSeconds) => {
    if (performance.now() - lastMoveTimeRef.current < idleThresholdMs) return
    const decay = Math.exp(-deltaSeconds * velocityDecayRate)
    pointerRef.current.velocity.x *= decay
    pointerRef.current.velocity.y *= decay
  })

  return pointerRef
}
