import { attemptGrab, registerMissOf } from '../ai/tools/support/grab'
import type { StepContext } from '../memory'
import { toolMemoryOf } from './toolState'

const jumpBehaviorIds = new Set(['jumpForTreat', 'jumpForToy', 'sneakyApproach'])

export function resolveToolJumps(context: StepContext): void {
  const { world } = context
  const memory = toolMemoryOf(world)
  memory.jumps.forEach((jump, catId) => {
    const cat = world.cats.find((candidate) => candidate.id === catId)
    const mind = context.memory.minds.get(catId)
    if (!cat || !mind || !mind.leap || !jumpBehaviorIds.has(cat.behavior)) {
      memory.jumps.delete(catId)
      return
    }
    if (jump.resolved || world.time < jump.checkAt) return
    const caught = attemptGrab(cat, jump.tool, context, jump.reachTop, jump.reachBottom)
    if (!caught && world.time < jump.checkUntil) return
    jump.resolved = true
    mind.scratchNumbers.jumpResult = caught ? 1 : -1
    if (caught) return
    registerMissOf(cat, jump.tool, context)
    if (context.memory.random.chance(0.45)) mind.leap.pose = 'bat'
  })
}
