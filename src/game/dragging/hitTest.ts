import { BALL_RADIUS } from '../constants'
import { hidingHeightOf } from '../layout'
import { depthScale, toScreen } from '../projection'
import { distance, distanceToSegment } from '../vector'
import type { DragHit, PropState, Vec, World } from '../types'

const treatReach = 22
const tallKinds = new Set(['catTree', 'lamppost', 'scratchingPost'])
const fixedKinds = new Set(['tree'])

function propHitDistance(prop: PropState, point: Vec, worldHeight: number): number | null {
  if (prop.tunnelExit) {
    const gap = distanceToSegment(point, prop.position, prop.tunnelExit)
    return gap < prop.radius * 1.4 ? gap : null
  }
  const drawScale = depthScale(prop.position.y, worldHeight)
  const above = prop.position.y - point.y
  const sideways = Math.abs(point.x - prop.position.x)
  if (prop.kind === 'tree') {
    const canopyTop = hidingHeightOf(prop, worldHeight) * 1.35
    return above > -prop.radius && above < canopyTop && sideways < prop.radius * 3.4 * drawScale ? sideways : null
  }
  if (tallKinds.has(prop.kind)) {
    const top = Math.max(prop.perchHeight, prop.radius * 5) * drawScale
    return above > -prop.radius && above < top && sideways < prop.radius * 1.2 * drawScale ? sideways : null
  }
  const gap = distance(prop.position, { x: point.x, y: point.y + prop.radius * 0.35 })
  return gap < prop.radius * 1.2 * drawScale ? gap : null
}

function hitTestProp(world: World, point: Vec): string | null {
  let best: PropState | null = null
  for (const prop of world.props) {
    if (fixedKinds.has(prop.kind) || propHitDistance(prop, point, world.height) === null) continue
    if (!best || prop.position.y > best.position.y) best = prop
  }
  return best ? best.id : null
}

export function hitTestDraggable(world: World, point: Vec): DragHit | null {
  const ball = world.balls.find((candidate) => candidate.status === 'loose' && distance(toScreen(candidate.position, candidate.height), point) < BALL_RADIUS * 2.2)
  if (ball) return { target: 'ball', id: ball.id }
  const treat = world.treats.find((candidate) => candidate.eatenAt === null && distance(toScreen(candidate.position, candidate.height), point) < treatReach)
  if (treat) return { target: 'treat', id: treat.id }
  const cat = world.cats.find((candidate) => !candidate.hidden && distance(toScreen(candidate.position, candidate.height + 16 * candidate.coat.scale), point) < 30 * candidate.coat.scale)
  if (cat) return { target: 'cat', id: cat.id }
  const propId = hitTestProp(world, point)
  return propId ? { target: 'prop', id: propId } : null
}
