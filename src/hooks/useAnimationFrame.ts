import { useEffect, useRef } from 'react'

type FrameCallback = (deltaSeconds: number, elapsedSeconds: number) => void

const maxFrameDelta = 0.1

export function useAnimationFrame(onFrame: FrameCallback, enabled = true): void {
  const callbackRef = useRef(onFrame)

  useEffect(() => {
    callbackRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    if (!enabled) return
    let frameHandle = 0
    let previousTimestamp: number | null = null
    let elapsedSeconds = 0

    const tick = (timestamp: number) => {
      const deltaSeconds =
        previousTimestamp === null ? 0 : Math.min((timestamp - previousTimestamp) / 1000, maxFrameDelta)
      previousTimestamp = timestamp
      elapsedSeconds += deltaSeconds
      callbackRef.current(deltaSeconds, elapsedSeconds)
      frameHandle = requestAnimationFrame(tick)
    }

    frameHandle = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameHandle)
  }, [enabled])
}
