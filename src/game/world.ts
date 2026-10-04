import { behaviorLibrary } from './ai/registry'
import { updateCat } from './ai/updateCat'
import { decayPropAgitation, stepEffects } from './effects'
import { updateTools } from './tools'
import { stepCalls } from './calls'
import { isDragging, stepDrag } from './dragging'
import { sampleMotion, trackMotion } from './motionTracking'
import { catSizeScale, lawnBounds } from './bounds'
import { createButterflies, stepButterflies } from './butterflies'
import { createCatProfiles } from './catalog'
import { BUTTERFLY_COUNT, CAT_COUNT, MAX_HIDDEN_CATS, MIN_VISIBLE_CATS, POP_LIFETIME, WORLD_SEED } from './constants'
import { createMind, type StepContext } from './memory'
import { stepBallPhysics } from './physics'
import { isFiniteVec } from './vector'
import type { CatState, PointerState, Vec, World, WorldConfig } from './types'
import { createMemory, idleContext, memoryFor, registerMemory } from './engine'
import { deliverBallsToCats, openSpot, spawnBalls, startInitialBehaviors } from './spawning'
import { checkPops, enforceVisibility, maintainStashes, sanitize, syncHeldBalls, syncOccupants } from './upkeep'
import { stepBallSupply } from './ballSupply'
import { stepLiveliness } from './liveliness'
import { createCareState } from './care/inventory'
import { trackBallHolders } from './care/catchTracking'
import { stepNeeds } from './needs/needStep'
import { createProgressState, usableTool } from './progress/progress'
import { initialHappiness } from './happiness/happiness'
import { stepHappiness } from './happiness/happinessStep'
import { createEconomyState } from './economy/economyState'
import { stepEconomy } from './economy/economyStep'
import { createLandscapeState } from './landscape/landscapeState'
import { createFreshParkProps } from './landscape/freshPark'
import { stepLandscape } from './landscape/landscapeStep'
import { stepShopItems } from './shopItems/shopItemStep'

export function createWorld(config: WorldConfig): World {
  const width = Math.max(1, config.width)
  const height = Math.max(1, config.height)
  const seed = config.seed ?? WORLD_SEED
  const memory = createMemory(seed, width, height)
  const props = createFreshParkProps(width, height, seed)
  const world: World = {
    width,
    height,
    time: 0,
    cats: [],
    balls: [],
    props,
    butterflies: [],
    effects: [],
    heldToy: null,
    treats: [],
    catnip: [],
    dayTime: 0.3,
    drag: null,
    treatBagShake: null,
    pops: [],
    poppedCount: 0,
    care: createCareState(),
    progress: createProgressState(),
    economy: createEconomyState(),
    landscape: createLandscapeState(),
  }
  const catCount = Math.max(config.catCount || CAT_COUNT, MIN_VISIBLE_CATS + MAX_HIDDEN_CATS)
  const profiles = createCatProfiles(catCount, memory.random, catSizeScale(width, height))
  const placed: Vec[] = []
  world.cats = profiles.map((profile, index): CatState => {
    const position = openSpot(world, memory, 20, placed, 70 * memory.sizeScale)
    placed.push(position)
    const mind = createMind(profile.personality)
    const id = `cat-${index}`
    memory.minds.set(id, mind)
    mind.decisionTimer = memory.random.range(0.2, 1.5)
    return {
      id,
      name: profile.name,
      position,
      velocity: { x: 0, y: 0 },
      height: 0,
      verticalSpeed: 0,
      facing: memory.random.sign(),
      pose: 'sit',
      intent: 'wander',
      intentTimer: 0,
      heldBallId: null,
      propId: null,
      hidden: false,
      behavior: '',
      emote: null,
      emoteAge: 0,
      action: null,
      actionAge: 0,
      leapStyle: null,
      fullness: memory.random.range(0.55, 1),
      affection: memory.random.range(0.15, 0.45),
      gaze: { x: position.x + 60, y: position.y },
      coat: profile.coat,
      clock: memory.random.range(0, 10),
      speedMultiplier: 1,
      followUntil: null,
      acceleration: { x: 0, y: 0 },
      launchedAt: null,
      landedAt: null,
      need: null,
      needUrge: 0,
      asleep: false,
      happiness: initialHappiness(memory.random),
      collar: null,
    }
  })
  startInitialBehaviors(idleContext(world, memory))
  world.balls = spawnBalls(world, memory, Math.max(1, config.ballCount), true)
  const butterflyCount = width * height < 520000 ? Math.max(3, BUTTERFLY_COUNT - 1) : BUTTERFLY_COUNT
  world.butterflies = createButterflies(butterflyCount, width, height, memory.random)
  registerMemory(world, memory)
  deliverBallsToCats(idleContext(world, memory))
  return world
}

export function stepWorld(world: World, dt: number, pointer: PointerState): World {
  const delta = Math.min(Math.max(0, Number.isFinite(dt) ? dt : 0), 1 / 30)
  if (delta <= 0) return world
  const memory = memoryFor(world)
  world.time += delta
  const context: StepContext = {
    world,
    memory,
    dt: delta,
    pointer: {
      position: { x: pointer.position.x, y: pointer.position.y },
      velocity: { x: pointer.velocity.x, y: pointer.velocity.y },
      active: pointer.active && isFiniteVec(pointer.position),
      pressed: pointer.pressed,
      tool: usableTool(world, pointer.tool),
    },
    bounds: lawnBounds(world.width, world.height),
    library: behaviorLibrary,
  }
  memory.lastPointer = context.pointer
  stepBallSupply(context)
  stepEconomy(context)
  stepLandscape(context)
  stepShopItems(context)
  stepLiveliness(context)
  stepNeeds(context)
  stepHappiness(context)
  maintainStashes(context)
  const motionSamples = sampleMotion(world)
  world.cats.forEach((cat) => {
    if (!isDragging(world, 'cat', cat.id)) updateCat(cat, context)
  })
  enforceVisibility(context)
  syncHeldBalls(world)
  trackBallHolders(world)
  stepBallPhysics(world, delta)
  checkPops(context)
  stepButterflies(world, delta, memory.random, context.pointer.active ? context.pointer.position : null)
  updateTools(world, context, delta, context.pointer)
  stepDrag(context)
  stepCalls(world)
  trackMotion(world, motionSamples, delta)
  world.pops = world.pops.filter((pop) => world.time - pop.time < POP_LIFETIME)
  stepEffects(world)
  decayPropAgitation(world, delta)
  syncOccupants(world)
  sanitize(context)
  return world
}
