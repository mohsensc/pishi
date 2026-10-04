import type { StepContext } from '../../memory'
import { add, distance, normalize, scale, subtract } from '../../vector'
import type { CatState, PropState, Vec } from '../../types'
import { catRadius, settleOnGround } from '../helpers/queries'

export interface TunnelRoute {
  from: Vec
  to: Vec
}

export function routeFrom(tunnel: PropState, point: Vec): TunnelRoute | null {
  if (!tunnel.tunnelExit) return null
  const nearStart = distance(point, tunnel.position) <= distance(point, tunnel.tunnelExit)
  const from = nearStart ? tunnel.position : tunnel.tunnelExit
  const to = nearStart ? tunnel.tunnelExit : tunnel.position
  return { from: { ...from }, to: { ...to } }
}

export function outwardAt(route: TunnelRoute, mouth: 'from' | 'to'): Vec {
  return mouth === 'from' ? normalize(subtract(route.from, route.to)) : normalize(subtract(route.to, route.from))
}

export function mouthApproach(tunnel: PropState, route: TunnelRoute, cat: CatState, context: StepContext, mouth: 'from' | 'to'): Vec {
  const point = mouth === 'from' ? route.from : route.to
  return settleOnGround(add(point, scale(outwardAt(route, mouth), tunnel.radius + catRadius(cat) + 4)), context, catRadius(cat))
}

export function isTunnelFree(tunnel: PropState, cat: CatState): boolean {
  return tunnel.tunnelExit !== null && tunnel.occupantIds.every((id) => id === cat.id)
}
