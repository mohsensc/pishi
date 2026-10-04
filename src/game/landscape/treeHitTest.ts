import { hidingHeightOf } from '../layout'
import { depthScale } from '../projection'
import type { PropState, Vec, World } from '../types'

export function treeAt(world: World, point: Vec): PropState | null {
  let best: PropState | null = null
  for (const prop of world.props) {
    if (prop.kind !== 'tree') continue
    const drawScale = depthScale(prop.position.y, world.height)
    const above = prop.position.y - point.y
    const sideways = Math.abs(point.x - prop.position.x)
    const inside = above > -prop.radius && above < hidingHeightOf(prop, world.height) * 1.35 && sideways < prop.radius * 3.4 * drawScale
    if (inside && (!best || prop.position.y > best.position.y)) best = prop
  }
  return best
}
