import { memo, useEffect, useRef, type RefObject } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import type { PointerState, ToolKind } from '../../game/types'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import styles from './Cursor.module.css'

interface CursorProps {
  pointerRef: RefObject<PointerState>
  tool: ToolKind
  hovering: boolean
  nearBall: boolean
  pressed: boolean
}

const followSpring = { stiffness: 1400, damping: 60, mass: 0.35 }
const ringSpring = { stiffness: 520, damping: 26 }

function ringScaleFor(hovering: boolean, nearBall: boolean, pressed: boolean): number {
  const base = nearBall ? 0.72 : hovering ? 1.3 : 1
  return base * (pressed ? 0.78 : 1)
}

function Cursor({ pointerRef, tool, hovering, nearBall, pressed }: CursorProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const targetX = useMotionValue(-100)
  const targetY = useMotionValue(-100)
  const ringX = useSpring(targetX, followSpring)
  const ringY = useSpring(targetY, followSpring)
  const ringScaleTarget = useMotionValue(1)
  const ringScale = useSpring(ringScaleTarget, ringSpring)
  const wasActiveRef = useRef(false)

  useAnimationFrame(() => {
    const pointer = pointerRef.current
    const { x, y } = pointer.position
    if (pointer.active && !wasActiveRef.current) {
      targetX.jump(x)
      targetY.jump(y)
      ringX.jump(x)
      ringY.jump(y)
    } else {
      targetX.set(x)
      targetY.set(y)
    }
    wasActiveRef.current = pointer.active
    if (layerRef.current) layerRef.current.style.opacity = pointer.active ? '1' : '0'
    if (dotRef.current) dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
  })

  useEffect(() => {
    ringScaleTarget.set(ringScaleFor(hovering, nearBall, pressed))
  }, [hovering, nearBall, pressed, ringScaleTarget])

  const handTool = tool === 'hand'

  return (
    <div ref={layerRef} className={styles.layer} style={{ opacity: 0 }} aria-hidden>
      {handTool && (
        <motion.div className={styles.ringAnchor} style={{ x: ringX, y: ringY }}>
          <motion.div className={styles.ring} data-armed={nearBall} data-hovering={hovering && !nearBall} style={{ scale: ringScale }} />
        </motion.div>
      )}
      <div ref={dotRef} className={styles.dot} data-tool={tool} />
    </div>
  )
}

export default memo(Cursor)
