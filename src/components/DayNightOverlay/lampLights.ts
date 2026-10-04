import { depthScale } from '../../game/projection'
import type { PropState } from '../../game/types'
import type { LightSpot } from './DayNightOverlay'

const lanternHeight = 179

export function lampLightsOf(props: PropState[], worldHeight: number): LightSpot[] {
  return props
    .filter((prop) => prop.kind === 'lamppost' && prop.lit)
    .map((prop) => {
      const scale = depthScale(prop.position.y, worldHeight) * Math.min(1.15, Math.max(0.6, prop.radius / 8))
      return {
        base: { x: prop.position.x, y: prop.position.y },
        head: { x: prop.position.x, y: prop.position.y - lanternHeight * scale },
        scale,
      }
    })
}
