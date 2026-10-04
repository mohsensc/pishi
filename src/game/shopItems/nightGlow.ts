import { nightness } from '../ai/helpers/propUse'
import type { StepContext } from '../memory'
import type { PropKind } from '../types'

const glowingKinds = new Set<PropKind>(['fountain', 'windmill', 'bubbleMachine', 'butterflyHouse', 'birdbath'])
const glowThreshold = 0.55

export function stepNightGlow(context: StepContext): void {
  const lit = nightness(context.world) > glowThreshold
  context.world.props.forEach((prop) => {
    if (glowingKinds.has(prop.kind) && prop.lit !== lit) prop.lit = lit
  })
}
