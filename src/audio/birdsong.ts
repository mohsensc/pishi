import type { AudioGraph } from './audioGraph'
import { between, pannedInto, playTone } from './synthesis'

type BirdSpecies = 'chirper' | 'whistler' | 'trill' | 'warbler' | 'dove'

interface Bird {
  species: BirdSpecies
  pan: number
  distance: number
  pitch: number
  nextAt: number
}

interface Cricket {
  pan: number
  pitch: number
  nextAt: number
  chirpsLeft: number
}

export interface Birdsong {
  schedule: (until: number, night: number, dawn: number) => void
}

const speciesPool: readonly BirdSpecies[] = ['chirper', 'whistler', 'trill', 'warbler', 'chirper', 'whistler', 'dove']
const flockSize = 4
const cricketCount = 2

function pickSpecies(graph: AudioGraph): BirdSpecies {
  return speciesPool[Math.floor(graph.random() * speciesPool.length)]
}

function rollBird(graph: AudioGraph, bird: Bird): void {
  bird.species = pickSpecies(graph)
  bird.pan = between(graph, -0.85, 0.85)
  bird.distance = between(graph, 0.35, 1)
  bird.pitch = between(graph, 0.9, 1.12)
}

function birdOutput(graph: AudioGraph, destination: AudioNode, bird: Bird): AudioNode {
  const context = graph.context
  const level = context.createGain()
  level.gain.value = 1.15 - bird.distance * 0.75
  const distanceFilter = context.createBiquadFilter()
  distanceFilter.type = 'lowpass'
  distanceFilter.frequency.value = 7600 - bird.distance * 3600
  const panner = pannedInto(graph, destination, bird.pan)
  const send = context.createGain()
  send.gain.value = 0.25 + bird.distance * 0.5
  level.connect(distanceFilter)
  distanceFilter.connect(panner)
  panner.connect(send)
  send.connect(graph.reverb)
  return level
}

function chirps(graph: AudioGraph, out: AudioNode, when: number, pitch: number): number {
  const count = 2 + Math.floor(graph.random() * 3)
  const spacing = between(graph, 0.1, 0.15)
  let end = when
  for (let chirp = 0; chirp < count; chirp += 1) {
    const top = between(graph, 3600, 4100) * pitch
    end = playTone(graph, out, when + chirp * spacing, { frequency: top, endFrequency: top * 0.68, glide: 0.055, attack: 0.01, decay: 0.06, peak: 0.05 })
  }
  return end
}

function whistle(graph: AudioGraph, out: AudioNode, when: number, pitch: number): number {
  const low = between(graph, 2500, 2900) * pitch
  const high = low * between(graph, 1.12, 1.25)
  playTone(graph, out, when, { frequency: low, endFrequency: high, glide: 0.14, attack: 0.025, hold: 0.06, decay: 0.14, peak: 0.042 })
  const second = when + 0.26
  const end = playTone(graph, out, second, { frequency: high, endFrequency: low * 0.88, glide: 0.18, attack: 0.02, hold: 0.05, decay: 0.16, peak: 0.038 })
  if (graph.random() < 0.5) return end
  return playTone(graph, out, second + 0.26, { frequency: high * 1.04, endFrequency: low, glide: 0.16, attack: 0.02, hold: 0.04, decay: 0.15, peak: 0.032 })
}

function trill(graph: AudioGraph, out: AudioNode, when: number, pitch: number): number {
  const start = between(graph, 4000, 4500) * pitch
  return playTone(graph, out, when, { frequency: start, endFrequency: start * 0.86, glide: 0.55, attack: 0.05, hold: 0.24, decay: 0.26, peak: 0.032, tremoloRate: between(graph, 30, 42), tremoloDepth: 0.95 })
}

function warble(graph: AudioGraph, out: AudioNode, when: number, pitch: number): number {
  const base = between(graph, 2800, 3200) * pitch
  playTone(graph, out, when, { frequency: base, endFrequency: base * 1.16, glide: 0.4, attack: 0.04, hold: 0.22, decay: 0.22, peak: 0.032, vibratoRate: between(graph, 10, 14), vibratoDepth: 320 })
  return playTone(graph, out, when + 0.55, { frequency: base * 1.1, endFrequency: base * 0.94, glide: 0.35, attack: 0.04, hold: 0.16, decay: 0.2, peak: 0.028, vibratoRate: between(graph, 10, 14), vibratoDepth: 280 })
}

const doveNotes: readonly [number, number, number][] = [
  [0, 0.32, 1],
  [0.46, 0.62, 1.14],
  [1.24, 0.3, 1],
  [1.66, 0.3, 0.97],
]

function dove(graph: AudioGraph, out: AudioNode, when: number, pitch: number): number {
  const base = between(graph, 500, 560) * pitch
  const soft = graph.context.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 1300
  soft.connect(out)
  let end = when
  doveNotes.forEach(([offset, length, bend]) => {
    end = playTone(graph, soft, when + offset, { frequency: base * bend * 0.96, endFrequency: base * bend, glide: length * 0.4, attack: length * 0.3, hold: length * 0.2, decay: length * 0.5, peak: 0.07 })
  })
  return end
}

function singCall(graph: AudioGraph, out: AudioNode, species: BirdSpecies, when: number, pitch: number): number {
  if (species === 'chirper') return chirps(graph, out, when, pitch)
  if (species === 'whistler') return whistle(graph, out, when, pitch)
  if (species === 'trill') return trill(graph, out, when, pitch)
  if (species === 'warbler') return warble(graph, out, when, pitch)
  return dove(graph, out, when, pitch)
}

function singSong(graph: AudioGraph, destination: AudioNode, bird: Bird, when: number): number {
  const out = birdOutput(graph, destination, bird)
  const repeats = bird.species === 'dove' ? 1 : 1 + Math.floor(graph.random() * 3)
  let cursor = when
  for (let call = 0; call < repeats; call += 1) {
    cursor = singCall(graph, out, bird.species, cursor, bird.pitch * between(graph, 0.97, 1.03)) + between(graph, 0.25, 0.6)
  }
  return cursor
}

function cricketChirp(graph: AudioGraph, destination: AudioNode, cricket: Cricket, when: number, level: number): void {
  const context = graph.context
  const oscillator = context.createOscillator()
  oscillator.frequency.value = 4450 * cricket.pitch
  const envelope = context.createGain()
  envelope.gain.value = 0
  envelope.gain.setValueAtTime(0, when)
  for (let pulse = 0; pulse < 3; pulse += 1) {
    const start = when + pulse * 0.034
    envelope.gain.linearRampToValueAtTime(level, start + 0.006)
    envelope.gain.linearRampToValueAtTime(0, start + 0.026)
  }
  oscillator.connect(envelope)
  envelope.connect(pannedInto(graph, destination, cricket.pan))
  oscillator.start(when)
  oscillator.stop(when + 0.14)
}

function owl(graph: AudioGraph, destination: AudioNode, when: number): void {
  const bird: Bird = { species: 'dove', pan: between(graph, -0.8, 0.8), distance: 0.9, pitch: 1, nextAt: 0 }
  const out = birdOutput(graph, destination, bird)
  const soft = graph.context.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 900
  soft.connect(out)
  const base = between(graph, 340, 380)
  playTone(graph, soft, when, { frequency: base * 1.04, endFrequency: base, glide: 0.3, attack: 0.08, hold: 0.12, decay: 0.3, peak: 0.08 })
  playTone(graph, soft, when + 0.9, { frequency: base * 1.02, endFrequency: base * 0.97, glide: 0.2, attack: 0.05, hold: 0.06, decay: 0.2, peak: 0.065 })
  playTone(graph, soft, when + 1.3, { frequency: base, endFrequency: base * 0.94, glide: 0.3, attack: 0.06, hold: 0.1, decay: 0.32, peak: 0.07 })
}

export function createBirdsong(graph: AudioGraph, destination: AudioNode, startAt: number): Birdsong {
  const birds: Bird[] = Array.from({ length: flockSize }, (_, index) => {
    const bird: Bird = { species: 'chirper', pan: 0, distance: 1, pitch: 1, nextAt: startAt + 1.5 + index * between(graph, 1.5, 4) }
    rollBird(graph, bird)
    return bird
  })
  const crickets: Cricket[] = Array.from({ length: cricketCount }, (_, index) => ({
    pan: index === 0 ? between(graph, -0.7, -0.3) : between(graph, 0.3, 0.7),
    pitch: between(graph, 0.94, 1.06),
    nextAt: startAt + index * 0.31,
    chirpsLeft: 10,
  }))
  let nextOwlAt = startAt + between(graph, 20, 50)

  const schedule = (until: number, night: number, dawn: number) => {
    const now = graph.context.currentTime
    const activity = Math.max(0.05, (1 - night * 0.92) * (0.8 + dawn * 0.9))
    birds.forEach((bird) => {
      if (bird.nextAt < now - 1) bird.nextAt = now + graph.random() * 2
      while (bird.nextAt < until) {
        const singing = graph.random() < Math.min(1, activity) && (bird.species !== 'dove' || night < 0.5)
        const songEnd = singing ? singSong(graph, destination, bird, bird.nextAt) : bird.nextAt
        bird.nextAt = songEnd + between(graph, 4, 15) / Math.max(0.3, activity)
        if (graph.random() < 0.2) rollBird(graph, bird)
      }
    })
    crickets.forEach((cricket) => {
      if (cricket.nextAt < now - 1) cricket.nextAt = now + graph.random()
      while (cricket.nextAt < until) {
        if (night < 0.15) {
          cricket.nextAt += 2
          continue
        }
        cricketChirp(graph, destination, cricket, cricket.nextAt, 0.012 * night)
        cricket.chirpsLeft -= 1
        if (cricket.chirpsLeft <= 0) {
          cricket.chirpsLeft = 6 + Math.floor(graph.random() * 14)
          cricket.nextAt += between(graph, 2.5, 7)
        } else cricket.nextAt += between(graph, 0.55, 0.78)
      }
    })
    if (nextOwlAt < now - 1) nextOwlAt = now + between(graph, 20, 40)
    while (nextOwlAt < until) {
      if (night > 0.6 && graph.random() < 0.7) owl(graph, destination, nextOwlAt)
      nextOwlAt += between(graph, 35, 80)
    }
  }

  return { schedule }
}
