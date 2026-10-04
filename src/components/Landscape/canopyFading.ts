import { isBehindCanopy } from '../../game/layoutOcclusion'
import type { Vec, World } from '../../game/types'

const catCenterLift = 12
const fadeMargin = 0.82

function revealedPoints(world: World): { screen: Vec; groundY: number; ownerPropId: string | null }[] {
  const balls = world.balls
    .filter((ball) => ball.status === 'loose')
    .map((ball) => ({ screen: { x: ball.position.x, y: ball.position.y - ball.height }, groundY: ball.position.y, ownerPropId: null }))
  const cats = world.cats
    .filter((cat) => !cat.hidden && !cat.asleep)
    .map((cat) => ({ screen: { x: cat.position.x, y: cat.position.y - cat.height - catCenterLift * cat.coat.scale }, groundY: cat.position.y, ownerPropId: cat.propId }))
  return [...balls, ...cats]
}

export function fadedTreeIds(world: World): string[] {
  const points = revealedPoints(world)
  if (points.length === 0) return []
  return world.props
    .filter((prop) => prop.kind === 'tree' && points.some((point) => point.ownerPropId !== prop.id && isBehindCanopy(prop, point.screen, point.groundY, world.height, fadeMargin)))
    .map((prop) => prop.id)
}
