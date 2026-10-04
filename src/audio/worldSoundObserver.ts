import { nightness } from '../components/DayNightOverlay/skyTint'
import type { CareItemKind } from '../game/care/careTypes'
import { tierOf } from '../game/economy/pricing'
import { pathCellCenter } from '../game/landscape/pathGrid'
import { depthScale } from '../game/projection'
import type { CatAction, CatState, PropKind, World, WorldEffect } from '../game/types'
import { playSound, setSoundAmbience } from './soundEngine'
import type { SoundCue, SoundName } from './soundTypes'

interface CatMemory {
  asleep: boolean
  needy: boolean
  collared: boolean
  action: CatAction | null
  actionAge: number
  munchReadyAt: number
  seenAt: number
}

export interface WorldSoundObserver {
  observe: (world: World) => void
  noteCatPoke: (world: World, catId: string, wasAsleep: boolean) => void
  noteCareGiven: (world: World, catId: string, kind: CareItemKind) => void
  noteTrayDiscard: () => void
}

const panSpread = 0.72
const nearGain = 1
const farGain = 0.6
const ambienceIntervalSeconds = 1.5
const fallLeadSeconds = 0.42
const rewardDelaySeconds = 0.5
const tierDelaySeconds = 0.9
const seenLimit = 480
const dawnCenter = 0.28
const dawnHalfWidth = 0.07
const feedingMunchCooldown: readonly [number, number] = [4, 6]
const forgetCatAfterSeconds = 30

const waterKinds = new Set<PropKind>(['pond', 'fountain', 'birdbath', 'sprinkler'])
const pettingBehaviors = new Set(['getPetted', 'getBrushed', 'enjoyCareItem', 'rubAgainstCursor', 'catnipKnead'])
const careSounds: Record<CareItemKind, SoundName> = { fish: 'munch', milk: 'lap', yarn: 'trill', brush: 'purr', treat: 'munch' }
const silentDenials = new Set(['throttled'])

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value))
}

function dawnOf(dayTime: number): number {
  return Math.max(0, 1 - Math.abs(dayTime - dawnCenter) / dawnHalfWidth)
}

function freshId(seen: Set<string>, id: string): boolean {
  if (seen.has(id)) return false
  seen.add(id)
  return true
}

function trimSeen<Item extends { id: string }>(seen: Set<string>, live: readonly Item[]): void {
  if (seen.size < seenLimit) return
  seen.clear()
  for (let index = 0; index < live.length; index += 1) seen.add(live[index].id)
}

export function createWorldSoundObserver(): WorldSoundObserver {
  const cue: SoundCue = { pan: 0, gain: 1, pitch: 1, intensity: 1, delay: 0, step: 0 }
  const seenEffects = new Set<string>()
  const seenPops = new Set<string>()
  const seenFelled = new Set<string>()
  const seenStamps = new Set<string>()
  const cats = new Map<string, CatMemory>()
  let primed = false
  let spendId: string | null = null
  let deniedId: string | null = null
  let rewardId: string | null = null
  let tier = 0
  let nextAmbienceAt = 0

  const place = (world: World, x: number, y: number, gain = 1): SoundCue => {
    const width = Math.max(1, world.width)
    const depth = (depthScale(y, world.height) - 0.8) / 0.3
    cue.pan = clampUnit((x / width) * 2 - 1) * panSpread
    cue.gain = gain * (farGain + (nearGain - farGain) * depth)
    cue.pitch = 1
    cue.intensity = 1
    cue.delay = 0
    cue.step = 0
    return cue
  }

  const centered = (gain = 1): SoundCue => {
    cue.pan = 0
    cue.gain = gain
    cue.pitch = 1
    cue.intensity = 1
    cue.delay = 0
    cue.step = 0
    return cue
  }

  const propKindOf = (world: World, propId: string | null): PropKind | null => {
    if (!propId) return null
    for (let index = 0; index < world.props.length; index += 1) {
      if (world.props[index].id === propId) return world.props[index].kind
    }
    return null
  }

  const voiceEffect = (world: World, effect: WorldEffect) => {
    const { x, y } = effect.position
    if (effect.kind === 'splash') {
      if (effect.intensity < 0.28) playSound('lap', place(world, x, y, 0.75))
      else if (effect.intensity < 0.55) playSound('drip', place(world, x, y, 0.8))
      else {
        const spot = place(world, x, y)
        spot.intensity = effect.intensity
        playSound('splash', spot)
      }
      return
    }
    if (effect.kind === 'bounce') {
      const kind = propKindOf(world, effect.propId)
      const spot = place(world, x, y)
      spot.intensity = effect.intensity
      if (kind !== 'pond') playSound('placeDrop', spot)
      if (kind && kind !== 'pond' && waterKinds.has(kind)) {
        const splashSpot = place(world, x, y, 0.8)
        splashSpot.delay = 0.08
        playSound('splash', splashSpot)
      }
      return
    }
    if (effect.kind === 'dust') {
      if (!effect.propId) return
      const spot = place(world, x, y, 0.5 + effect.intensity * 0.5)
      spot.intensity = effect.intensity
      playSound('propBump', spot)
      return
    }
    if (effect.kind === 'poof') {
      const spot = place(world, x, y)
      spot.intensity = effect.intensity
      playSound('trash', spot)
      return
    }
    if (effect.kind === 'leaves') {
      const spot = place(world, x, y, 0.9)
      spot.intensity = effect.intensity
      playSound('rustle', spot)
      return
    }
    if (effect.kind === 'birds') playSound('flutter', place(world, x, y, 0.8))
    else if (effect.kind === 'bubbles') playSound('bubbles', place(world, x, y, 0.8))
  }

  const voiceCat = (world: World, cat: CatState, memory: CatMemory) => {
    if (cat.hidden) return
    const { x, y } = cat.position
    if (!memory.needy && cat.need) playSound('request', place(world, x, y, 0.85))
    if (!memory.asleep && cat.asleep) playSound('yawn', place(world, x, y, 0.85))
    if (!memory.collared && cat.collar) playSound('collar', place(world, x, y))
    if (!cat.action || (cat.action === memory.action && cat.actionAge >= memory.actionAge)) return
    if (cat.action === 'munch') {
      if (cat.behavior === 'enjoyCareItem') playSound('munch', place(world, x, y, 0.9))
      else if (world.time >= memory.munchReadyAt) {
        memory.munchReadyAt = world.time + feedingMunchCooldown[0] + Math.random() * (feedingMunchCooldown[1] - feedingMunchCooldown[0])
        playSound('munch', place(world, x, y, 0.45))
      }
    }
    else if (cat.action === 'purr' && pettingBehaviors.has(cat.behavior)) playSound('purr', place(world, x, y, 0.9))
    else if (cat.action === 'catchTreat') playSound('gulp', place(world, x, y))
    else if (cat.action === 'shakeOff') playSound('shake', place(world, x, y, 0.8))
  }

  const rememberCat = (cat: CatState) => {
    let memory = cats.get(cat.id)
    if (!memory) {
      memory = { asleep: false, needy: false, collared: false, action: null, actionAge: 0, munchReadyAt: 0, seenAt: 0 }
      cats.set(cat.id, memory)
    }
    return memory
  }

  const storeCat = (world: World, cat: CatState, memory: CatMemory) => {
    memory.seenAt = world.time
    memory.asleep = Boolean(cat.asleep)
    memory.needy = Boolean(cat.need) && !cat.hidden
    memory.collared = Boolean(cat.collar)
    memory.action = cat.action
    memory.actionAge = cat.actionAge
  }

  const voiceEconomy = (world: World) => {
    const economy = world.economy
    const spend = economy.lastSpend
    if (spend && spend.id !== spendId) {
      spendId = spend.id
      playSound('purchase', spend.position ? place(world, spend.position.x, spend.position.y) : centered())
    }
    const denied = economy.lastDenied
    if (denied && denied.id !== deniedId) {
      deniedId = denied.id
      if (!silentDenials.has(denied.reason)) playSound('denied', denied.position ? place(world, denied.position.x, denied.position.y) : centered())
    }
    const reward = world.care.lastReward
    if (reward && reward.id !== rewardId) {
      rewardId = reward.id
      if (reward.unlockedKind) {
        const spot = centered(0.9)
        spot.delay = rewardDelaySeconds
        playSound('unlock', spot)
      }
    }
    const currentTier = tierOf(economy.lifetimeEarned)
    if (currentTier > tier) {
      const spot = centered()
      spot.delay = tierDelaySeconds
      playSound('tierUp', spot)
    }
    tier = currentTier
  }

  const voicePops = (world: World) => {
    const reward = world.care.lastReward
    for (let index = 0; index < world.pops.length; index += 1) {
      const pop = world.pops[index]
      if (!freshId(seenPops, pop.id)) continue
      const stolen = reward !== null && reward.time === pop.time && reward.catchKind === 'stolen'
      playSound(stolen ? 'ballSteal' : 'ballPop', place(world, pop.position.x, pop.position.y))
    }
    trimSeen(seenPops, world.pops)
  }

  const voiceLandscape = (world: World) => {
    const landscape = world.landscape
    for (let index = 0; index < landscape.felled.length; index += 1) {
      const tree = landscape.felled[index]
      if (!freshId(seenFelled, tree.id)) continue
      playSound('treeChop', place(world, tree.position.x, tree.position.y))
      const fall = place(world, tree.position.x + tree.direction * tree.radius, tree.position.y)
      fall.intensity = tree.scale
      fall.delay = fallLeadSeconds
      playSound('treeFall', fall)
    }
    trimSeen(seenFelled, landscape.felled)
    for (let index = 0; index < landscape.stamps.length; index += 1) {
      const stamp = landscape.stamps[index]
      if (!freshId(seenStamps, stamp.id)) continue
      const center = stamp.cells.length > 0 ? pathCellCenter(world.width, world.height, stamp.cells[stamp.cells.length - 1]) : null
      const spot = center ? place(world, center.x, center.y, 0.9) : centered(0.9)
      playSound(stamp.style === 'stone' ? 'pathStone' : stamp.style === 'gravel' ? 'pathGravel' : 'pathErase', spot)
    }
    trimSeen(seenStamps, landscape.stamps)
  }

  const prime = (world: World) => {
    world.effects.forEach((effect) => seenEffects.add(effect.id))
    world.pops.forEach((pop) => seenPops.add(pop.id))
    world.landscape.felled.forEach((tree) => seenFelled.add(tree.id))
    world.landscape.stamps.forEach((stamp) => seenStamps.add(stamp.id))
    world.cats.forEach((cat) => storeCat(world, cat, rememberCat(cat)))
    spendId = world.economy.lastSpend?.id ?? null
    deniedId = world.economy.lastDenied?.id ?? null
    rewardId = world.care.lastReward?.id ?? null
    tier = tierOf(world.economy.lifetimeEarned)
    primed = true
  }

  const watch = (world: World) => {
    if (world.time >= nextAmbienceAt || !primed) {
      nextAmbienceAt = world.time + ambienceIntervalSeconds
      setSoundAmbience(nightness(world.dayTime), dawnOf(world.dayTime))
      forgetDepartedCats(world)
    }
    if (!primed) {
      prime(world)
      return
    }
    for (let index = 0; index < world.effects.length; index += 1) {
      const effect = world.effects[index]
      if (freshId(seenEffects, effect.id)) voiceEffect(world, effect)
    }
    trimSeen(seenEffects, world.effects)
    voicePops(world)
    voiceLandscape(world)
    voiceEconomy(world)
    for (let index = 0; index < world.cats.length; index += 1) {
      const cat = world.cats[index]
      const memory = rememberCat(cat)
      voiceCat(world, cat, memory)
      storeCat(world, cat, memory)
    }
  }

  const forgetDepartedCats = (world: World) => {
    cats.forEach((memory, catId) => {
      if (world.time - memory.seenAt > forgetCatAfterSeconds) cats.delete(catId)
    })
  }

  const observe = (world: World) => {
    try {
      watch(world)
    } catch {
      return
    }
  }

  const noteCatPoke = (world: World, catId: string, wasAsleep: boolean) => {
    const cat = world.cats.find((candidate) => candidate.id === catId)
    if (!cat || cat.hidden || cat.emoteAge > 0) return
    const spot = place(world, cat.position.x, cat.position.y)
    if (cat.emote === 'annoyed') {
      spot.gain *= wasAsleep ? 1 : 0.7
      playSound('grumpy', spot)
    } else if (wasAsleep && cat.emote === 'sleepy') {
      spot.gain *= 0.7
      spot.pitch = 1.12
      playSound('grumpy', spot)
    } else if (cat.emote === 'love') {
      spot.gain *= 0.8
      playSound('trill', spot)
    }
  }

  const noteCareGiven = (world: World, catId: string, kind: CareItemKind) => {
    const cat = world.cats.find((candidate) => candidate.id === catId)
    const spot = cat ? place(world, cat.position.x, cat.position.y) : centered()
    playSound(careSounds[kind], spot)
  }

  const noteTrayDiscard = () => {
    const spot = centered(0.8)
    spot.intensity = 0.7
    playSound('trash', spot)
  }

  const guarded = <Args extends unknown[]>(handler: (...args: Args) => void) => (...args: Args) => {
    try {
      handler(...args)
    } catch {
      return
    }
  }

  return { observe, noteCatPoke: guarded(noteCatPoke), noteCareGiven: guarded(noteCareGiven), noteTrayDiscard: guarded(noteTrayDiscard) }
}
