import { dockKeepOut, lawnBounds } from './bounds'
import {
  BALL_AIR_DRAG,
  BALL_GROUND_FRICTION,
  BALL_RADIUS,
  BALL_RESTITUTION,
  BALL_REST_SPEED,
  BALL_WALL_RESTITUTION,
  GRAVITY,
  POND_ASPECT,
  POND_DAMPING,
  POND_DRIFT_SPEED,
} from './constants'
import { propSolidHeight } from './layout'
import { pathStyleAt } from './landscape/pathGrid'
import type { PathStyle } from './landscape/landscapeTypes'
import type { BallState, PropState, Vec, World } from './types'
import { length } from './vector'

export function pondReach(pond: PropState, point: Vec): number {
  const dx = (point.x - pond.position.x) / pond.radius
  const dy = (point.y - pond.position.y) / (pond.radius * POND_ASPECT)
  return Math.hypot(dx, dy)
}

export function isInPond(props: PropState[], point: Vec, margin = 1): PropState | null {
  return props.find((prop) => prop.kind === 'pond' && pondReach(prop, point) < margin) ?? null
}

function bounceOffWalls(ball: BallState, world: World): void {
  const bounds = lawnBounds(world.width, world.height, -12)
  if (ball.position.x < bounds.left) {
    ball.position.x = bounds.left
    ball.velocity.x = Math.abs(ball.velocity.x) * BALL_WALL_RESTITUTION
  } else if (ball.position.x > bounds.right) {
    ball.position.x = bounds.right
    ball.velocity.x = -Math.abs(ball.velocity.x) * BALL_WALL_RESTITUTION
  }
  if (ball.position.y < bounds.top) {
    ball.position.y = bounds.top
    ball.velocity.y = Math.abs(ball.velocity.y) * BALL_WALL_RESTITUTION
  } else if (ball.position.y > bounds.bottom) {
    ball.position.y = bounds.bottom
    ball.velocity.y = -Math.abs(ball.velocity.y) * BALL_WALL_RESTITUTION
  }
}

const dockBallClearance = 84
const pathFriction: Record<PathStyle, number> = { gravel: 1.45, stone: 0.7 }

function groundFrictionAt(world: World, point: Vec): number {
  const style = world.landscape ? pathStyleAt(world.landscape.pathCells, world.width, world.height, point) : null
  return BALL_GROUND_FRICTION * (style ? pathFriction[style] : 1)
}

function bounceOffDock(ball: BallState, world: World): void {
  const zone = dockKeepOut(world.width, world.height)
  if (!zone || ball.position.x >= dockBallClearance || ball.position.y < zone.top || ball.position.y > zone.bottom) return
  ball.position.x = dockBallClearance
  ball.velocity.x = Math.abs(ball.velocity.x) * BALL_WALL_RESTITUTION
}

function collideWithProps(ball: BallState, props: PropState[]): void {
  props.forEach((prop) => {
    if (!prop.solid || ball.height > propSolidHeight(prop)) return
    const offsetX = ball.position.x - prop.position.x
    const offsetY = ball.position.y - prop.position.y
    const reach = prop.radius + BALL_RADIUS * 0.8
    const gap = Math.hypot(offsetX, offsetY)
    if (gap >= reach) return
    const normalX = gap > 1e-4 ? offsetX / gap : 1
    const normalY = gap > 1e-4 ? offsetY / gap : 0
    ball.position.x = prop.position.x + normalX * reach
    ball.position.y = prop.position.y + normalY * reach
    const approach = ball.velocity.x * normalX + ball.velocity.y * normalY
    if (approach < 0) {
      ball.velocity.x -= (1 + BALL_WALL_RESTITUTION) * approach * normalX
      ball.velocity.y -= (1 + BALL_WALL_RESTITUTION) * approach * normalY
    }
  })
}

function collideBalls(balls: BallState[]): void {
  const loose = balls.filter((ball) => ball.status === 'loose')
  for (let firstIndex = 0; firstIndex < loose.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < loose.length; secondIndex += 1) {
      const firstBall = loose[firstIndex]
      const secondBall = loose[secondIndex]
      if (Math.abs(firstBall.height - secondBall.height) > BALL_RADIUS * 2) continue
      const offsetX = secondBall.position.x - firstBall.position.x
      const offsetY = secondBall.position.y - firstBall.position.y
      const gap = Math.hypot(offsetX, offsetY)
      const reach = BALL_RADIUS * 2
      if (gap >= reach || gap < 1e-4) continue
      const normalX = offsetX / gap
      const normalY = offsetY / gap
      const push = (reach - gap) / 2
      firstBall.position.x -= normalX * push
      firstBall.position.y -= normalY * push
      secondBall.position.x += normalX * push
      secondBall.position.y += normalY * push
      const relative = (secondBall.velocity.x - firstBall.velocity.x) * normalX + (secondBall.velocity.y - firstBall.velocity.y) * normalY
      if (relative < 0) {
        const impulse = -relative * 0.9
        firstBall.velocity.x -= impulse * normalX
        firstBall.velocity.y -= impulse * normalY
        secondBall.velocity.x += impulse * normalX
        secondBall.velocity.y += impulse * normalY
      }
    }
  }
}

function floatInPond(ball: BallState, pond: PropState, dt: number, time: number): void {
  const outwardX = ball.position.x - pond.position.x
  const outwardY = (ball.position.y - pond.position.y) / (POND_ASPECT * POND_ASPECT)
  const size = Math.hypot(outwardX, outwardY) || 1
  const damping = Math.exp(-POND_DAMPING * dt)
  ball.velocity.x = ball.velocity.x * damping + (outwardX / size) * POND_DRIFT_SPEED * (1 - damping)
  ball.velocity.y = ball.velocity.y * damping + (outwardY / size) * POND_DRIFT_SPEED * (1 - damping)
  ball.verticalSpeed = 0
  ball.height = 2 + Math.sin(time * 3.2 + ball.position.x * 0.05) * 1.6
}

export function launchBall(ball: BallState, velocity: Vec, verticalSpeed: number): void {
  ball.status = 'loose'
  ball.holderId = null
  ball.stashPropId = null
  ball.velocity = { x: velocity.x, y: velocity.y }
  ball.verticalSpeed = verticalSpeed
}

export function aimToss(from: Vec, fromHeight: number, target: Vec, flightTime: number): { velocity: Vec; verticalSpeed: number } {
  const drag = Math.max(0.2, 1 - BALL_AIR_DRAG * flightTime * 0.5)
  return {
    velocity: { x: (target.x - from.x) / flightTime / drag, y: (target.y - from.y) / flightTime / drag },
    verticalSpeed: (GRAVITY * flightTime * flightTime * 0.5 - fromHeight) / flightTime,
  }
}

export function stepBallPhysics(world: World, dt: number): void {
  world.balls.forEach((ball) => {
    if (ball.status !== 'loose') return
    const pond = ball.height < 6 ? isInPond(world.props, ball.position, 0.9) : null
    if (pond) {
      floatInPond(ball, pond, dt, world.time)
    } else {
      const airborne = ball.height > 0 || ball.verticalSpeed > 0
      if (airborne) {
        ball.verticalSpeed -= GRAVITY * dt
        ball.height += ball.verticalSpeed * dt
        const drag = 1 - BALL_AIR_DRAG * dt
        ball.velocity.x *= drag
        ball.velocity.y *= drag
        if (ball.height <= 0) {
          ball.height = 0
          if (ball.verticalSpeed < -BALL_REST_SPEED) {
            ball.verticalSpeed = -ball.verticalSpeed * BALL_RESTITUTION
            ball.velocity.x *= 0.88
            ball.velocity.y *= 0.88
          } else {
            ball.verticalSpeed = 0
          }
        }
      } else {
        const friction = Math.exp(-groundFrictionAt(world, ball.position) * dt)
        ball.velocity.x *= friction
        ball.velocity.y *= friction
        if (length(ball.velocity) < 5) ball.velocity = { x: 0, y: 0 }
      }
    }
    ball.position.x += ball.velocity.x * dt
    ball.position.y += ball.velocity.y * dt
    const rollSpeed = length(ball.velocity)
    ball.spin += ((ball.velocity.x >= 0 ? 1 : -1) * rollSpeed * dt) / BALL_RADIUS
    if (ball.spin > 1000 || ball.spin < -1000) ball.spin %= Math.PI * 2
    collideWithProps(ball, world.props)
    bounceOffWalls(ball, world)
    bounceOffDock(ball, world)
  })
  collideBalls(world.balls)
}
