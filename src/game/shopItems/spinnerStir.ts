import type { StepContext } from '../memory'
import type { PropState } from '../types'
import { clamp, distance, length } from '../vector'

const spinnerHeads: Partial<Record<PropState['kind'], number>> = { pinwheel: 58, windmill: 150 }

function pointerStir(prop: PropState, head: number, context: StepContext): number {
  const pointer = context.pointer
  if (!pointer.active) return 0
  const scale = context.memory.sizeScale
  const headPoint = { x: prop.position.x, y: prop.position.y - head * scale }
  const reach = (head > 100 ? 130 : 80) * scale
  const gap = Math.min(distance(pointer.position, headPoint), distance(pointer.position, prop.position))
  if (gap > reach) return 0
  return clamp(length(pointer.velocity) / 700, 0, 1) * (1 - gap / reach) * 1.6
}

function catStir(prop: PropState, context: StepContext): number {
  const reach = (prop.radius + 46) * context.memory.sizeScale
  return context.world.cats.some((cat) => !cat.hidden && length(cat.velocity) > 90 && distance(cat.position, prop.position) < reach) ? 0.7 : 0
}

export function stirSpinners(context: StepContext): void {
  context.world.props.forEach((prop) => {
    const head = spinnerHeads[prop.kind]
    if (head === undefined) return
    const stir = Math.max(pointerStir(prop, head, context), catStir(prop, context))
    if (stir > prop.agitation) prop.agitation = Math.min(1, stir)
  })
}
