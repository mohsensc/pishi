import { AGITATION_DECAY, EFFECT_LIFETIME } from './constants'
import type { EffectKind, Vec, World, WorldEffect } from './types'

const effectSerials = new WeakMap<World, number>()

function nextEffectId(world: World): string {
  const serial = (effectSerials.get(world) ?? 0) + 1
  effectSerials.set(world, serial)
  return `effect-${serial}`
}

export function spawnEffect(world: World, kind: EffectKind, position: Vec, height = 0, propId: string | null = null, intensity = 1): WorldEffect {
  const effect: WorldEffect = {
    id: nextEffectId(world),
    kind,
    position: { x: position.x, y: position.y },
    height,
    time: world.time,
    propId,
    intensity,
  }
  world.effects.push(effect)
  return effect
}

export function stepEffects(world: World): void {
  if (world.effects.length === 0) return
  world.effects = world.effects.filter((effect) => world.time - effect.time < EFFECT_LIFETIME)
}

export function decayPropAgitation(world: World, dt: number): void {
  world.props.forEach((prop) => {
    if (prop.agitation > 0) prop.agitation = Math.max(0, prop.agitation - AGITATION_DECAY * dt)
  })
}
