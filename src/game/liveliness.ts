import { CATCH_EXCITEMENT, EXCITEMENT_DECAY_SECONDS, LIVELY_WAVE_AMPLITUDE, LIVELY_WAVE_SECONDS, MAX_EXCITEMENT } from './constants'
import type { StepContext } from './memory'
import type { World } from './types'
import { needPace } from './needs/needPace'

const excitementLevels = new WeakMap<World, number>()
const easeRate = 1.6

export function exciteCats(world: World, amount = CATCH_EXCITEMENT): void {
  excitementLevels.set(world, Math.min(MAX_EXCITEMENT, (excitementLevels.get(world) ?? 0) + amount))
}

export function stepLiveliness(context: StepContext): void {
  const { world, dt } = context
  const excitement = (excitementLevels.get(world) ?? 0) * Math.exp(-dt / EXCITEMENT_DECAY_SECONDS)
  excitementLevels.set(world, excitement)
  const ease = 1 - Math.exp(-dt * easeRate)
  world.cats.forEach((cat, index) => {
    const wave = 0.5 + 0.5 * Math.sin((world.time / LIVELY_WAVE_SECONDS) * Math.PI * 2 + index * 1.7)
    const target = (1 + LIVELY_WAVE_AMPLITUDE * wave + excitement) * needPace(world, cat)
    cat.speedMultiplier += (target - cat.speedMultiplier) * ease
  })
}
