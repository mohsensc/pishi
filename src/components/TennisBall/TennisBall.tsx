import { memo, useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'motion/react'
import type { BallState } from '../../game/types'
import { BALL_RADIUS } from '../../game/constants'
import { depthScale, toScreen } from '../../game/projection'
import TennisBallGraphic from './TennisBallGraphic'
import styles from './TennisBall.module.css'

interface TennisBallProps {
  ball: BallState
  worldHeight: number
  floating?: boolean
}

const impactSpeedThreshold = 70
const groundedHeight = 6

function useImpactSquash(ball: BallState) {
  const squashControls = useAnimationControls()
  const previousMotionRef = useRef({ verticalSpeed: ball.verticalSpeed, height: ball.height })

  useEffect(() => {
    const previous = previousMotionRef.current
    const landed =
      ball.status === 'loose' &&
      previous.verticalSpeed < -impactSpeedThreshold &&
      ball.verticalSpeed > previous.verticalSpeed + impactSpeedThreshold &&
      ball.height < groundedHeight
    previousMotionRef.current = { verticalSpeed: ball.verticalSpeed, height: ball.height }
    if (!landed) return
    const intensity = Math.min(Math.abs(previous.verticalSpeed) / 600, 1)
    void squashControls.start({
      scaleY: [1 - 0.32 * intensity, 1 + 0.08 * intensity, 1],
      scaleX: [1 + 0.26 * intensity, 1 - 0.05 * intensity, 1],
      transition: { duration: 0.26, ease: 'easeOut', times: [0, 0.45, 1] },
    })
  }, [ball.verticalSpeed, ball.height, ball.status, squashControls])

  return squashControls
}

function TennisBall({ ball, worldHeight, floating = false }: TennisBallProps) {
  const squashControls = useImpactSquash(ball)

  if (ball.status !== 'loose') return null

  const scale = depthScale(ball.position.y, worldHeight)
  const ballSize = BALL_RADIUS * 2 * scale
  const floorPoint = toScreen(ball.position, 0)
  const liftedPoint = toScreen(ball.position, ball.height)
  const liftRatio = Math.min(ball.height / 160, 1)
  const shadowWidth = ballSize * (1.05 - liftRatio * 0.45)
  const shadowHeight = shadowWidth * 0.32
  const sinkDepth = floating ? ballSize * 0.28 : 0

  return (
    <div
      className={styles.anchor}
      data-ball-id={ball.id}
      data-status={ball.status}
      data-screen-x={Math.round(liftedPoint.x)}
      data-screen-y={Math.round(liftedPoint.y - ballSize / 2)}
      data-height={Math.round(ball.height)}
      style={{ zIndex: Math.round(ball.position.y) }}
    >
      {floating ? (
        <div
          className={styles.ripple}
          style={{
            width: ballSize * 1.9,
            height: ballSize * 0.62,
            transform: `translate3d(${floorPoint.x - ballSize * 0.95}px, ${floorPoint.y - ballSize * 0.31}px, 0)`,
          }}
        />
      ) : (
        <div
          className={styles.shadow}
          style={{
            width: shadowWidth,
            height: shadowHeight,
            opacity: 1 - liftRatio * 0.6,
            transform: `translate3d(${floorPoint.x - shadowWidth / 2}px, ${floorPoint.y - shadowHeight / 2}px, 0)`,
          }}
        />
      )}
      <div
        className={styles.lift}
        style={{
          width: ballSize,
          height: ballSize - sinkDepth,
          overflow: floating ? 'hidden' : 'visible',
          transform: `translate3d(${liftedPoint.x - ballSize / 2}px, ${liftedPoint.y - ballSize + sinkDepth}px, 0)`,
        }}
      >
        <div className={floating ? styles.bobbing : undefined}>
          <motion.div className={styles.ball} animate={squashControls} style={{ width: ballSize, height: ballSize }}>
            <TennisBallGraphic size={ballSize} spin={ball.spin} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default memo(TennisBall)
