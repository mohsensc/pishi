import { releaseButterfly } from '../butterflies'
import type { StepContext } from '../memory'
import type { PropState } from '../types'
import { shopItemMemoryOf } from './shopItemMemory'

const releaseGap: [number, number] = [30, 60]
const firstRelease: [number, number] = [4, 9]
const housePopulation = 3
const butterflyCeiling = 12
const butterflyLifetime = 55
const doorHeight = 64

export function openButterflyHouse(context: StepContext, prop: PropState): boolean {
  const { world, memory } = context
  const shopMemory = shopItemMemoryOf(world)
  const alive = new Set(world.butterflies.map((butterfly) => butterfly.id))
  const released = (shopMemory.releasedButterflies.get(prop.id) ?? []).filter((id) => alive.has(id))
  prop.pokedAt = world.time
  if (released.length >= housePopulation) {
    shopMemory.releasedButterflies.set(prop.id, released)
    return false
  }
  const door = { x: prop.position.x, y: prop.position.y + 2 }
  const id = releaseButterfly(world, door, memory.random, butterflyLifetime, butterflyCeiling)
  if (id) {
    released.push(id)
    world.butterflies[world.butterflies.length - 1].height = doorHeight * memory.sizeScale
  }
  shopMemory.releasedButterflies.set(prop.id, released)
  return id !== null
}

export function stepButterflyHouses(context: StepContext): void {
  const { world, memory } = context
  const shopMemory = shopItemMemoryOf(world)
  world.props.forEach((prop) => {
    if (prop.kind !== 'butterflyHouse') return
    const due = shopMemory.nextButterflyAt.get(prop.id)
    if (due === undefined) {
      shopMemory.nextButterflyAt.set(prop.id, world.time + memory.random.range(...firstRelease))
      return
    }
    if (world.time < due) return
    openButterflyHouse(context, prop)
    shopMemory.nextButterflyAt.set(prop.id, world.time + memory.random.range(...releaseGap))
  })
}
