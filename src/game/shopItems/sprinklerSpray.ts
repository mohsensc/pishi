import { setAction, setEmote } from '../ai/helpers/pose'
import { mindOf } from '../ai/helpers/queries'
import { archAway } from '../ai/helpers/reactions'
import { beginFlee } from '../ai/helpers/transitions'
import { spawnEffect } from '../effects'
import type { StepContext } from '../memory'
import type { CatState, PropState } from '../types'
import { distance } from '../vector'
import { shopItemMemoryOf } from './shopItemMemory'

export const SPRINKLER_REACH = 96
export const SPRINKLER_PLAY_ID = 'sprinklerPounce'

const soakChancePerSecond = 0.9
const soakCooldown = 4.5

function soak(cat: CatState, prop: PropState, context: StepContext): void {
  const mind = mindOf(cat, context)
  spawnEffect(context.world, 'splash', cat.position, 18 * cat.coat.scale, null, 0.35)
  if (cat.behavior === SPRINKLER_PLAY_ID) {
    setEmote(cat, 'playful')
    return
  }
  setAction(cat, 'shakeOff')
  if (mind.leap || cat.height > 1 || cat.heldBallId || !context.library.byId.get(cat.behavior)?.interruptible) return
  setEmote(cat, 'startled')
  archAway(cat, mind, prop.position, 0.5, 160)
  if (context.memory.random.chance(0.6)) beginFlee(cat, mind, context, 1.1)
}

export function stepSprinklers(context: StepContext): void {
  const { world, memory } = context
  const sprinklers = world.props.filter((prop) => prop.kind === 'sprinkler' && prop.lift <= 0)
  if (sprinklers.length === 0) return
  const soakedUntil = shopItemMemoryOf(world).soakedUntil
  const reach = SPRINKLER_REACH * memory.sizeScale
  world.cats.forEach((cat) => {
    if (cat.hidden || cat.height > 30 || (soakedUntil.get(cat.id) ?? 0) > world.time) return
    const sprinkler = sprinklers.find((prop) => distance(prop.position, cat.position) < reach)
    if (!sprinkler || !memory.random.chance(soakChancePerSecond * context.dt)) return
    soakedUntil.set(cat.id, world.time + soakCooldown)
    soak(cat, sprinkler, context)
  })
}
