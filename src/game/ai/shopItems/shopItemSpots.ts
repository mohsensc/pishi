import type { PerchSpot, StepContext } from '../../memory'
import { depthScale } from '../../projection'
import type { CatState, PropState, Vec } from '../../types'
import { ringPoint } from '../helpers/propSpots'
import { catRadius, settleOnGround } from '../helpers/queries'

const swingLevel = 40
const rimLevel = 41

export function drawScaleOf(prop: PropState, context: StepContext): number {
  return depthScale(prop.position.y, context.world.height)
}

export function headPoint(prop: PropState, context: StepContext, height: number): Vec {
  return { x: prop.position.x, y: prop.position.y - height * context.memory.sizeScale * drawScaleOf(prop, context) }
}

export function facingRingPoint(prop: PropState, cat: CatState, context: StepContext, extra = 4): Vec {
  const angle = Math.atan2(cat.position.y - prop.position.y, cat.position.x - prop.position.x)
  const frontBiased = Math.atan2(Math.max(0.35, Math.sin(angle)), Math.cos(angle))
  return settleOnGround(ringPoint(prop, cat, context, frontBiased, extra), context, catRadius(cat))
}

export function swingSeatSpot(swing: PropState, context: StepContext): PerchSpot {
  return { propId: swing.id, level: swingLevel, spot: { x: swing.position.x, y: swing.position.y + 1 }, height: swing.perchHeight * drawScaleOf(swing, context) }
}

export function fountainRimSpots(fountain: PropState, context: StepContext): PerchSpot[] {
  const drawScale = drawScaleOf(fountain, context)
  return [-1, 1].map((side, index) => ({
    propId: fountain.id,
    level: rimLevel + index,
    spot: { x: fountain.position.x + side * fountain.radius * 0.78 * drawScale, y: fountain.position.y + fountain.radius * 0.18 * drawScale },
    height: fountain.perchHeight * drawScale,
  }))
}
