import { useEffect, useRef } from 'react'
import { useAnimationFrame, useMotionValue, type MotionValue } from 'motion/react'

export function useSpin(targetSpeed: number, phase: number): MotionValue<number> {
  const angle = useMotionValue(phase * 360)
  const targetRef = useRef(targetSpeed)
  const speedRef = useRef(targetSpeed)
  useEffect(() => {
    targetRef.current = targetSpeed
  }, [targetSpeed])
  useAnimationFrame((_, delta) => {
    const step = Math.min(delta, 64)
    const ease = targetRef.current > speedRef.current ? 0.012 : 0.0025
    speedRef.current += (targetRef.current - speedRef.current) * Math.min(1, ease * step)
    angle.set((angle.get() + (speedRef.current * step) / 1000) % 360)
  })
  return angle
}
