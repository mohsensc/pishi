import type { AudioGraph } from './audioGraph'
import { createBirdsong } from './birdsong'
import { between, midiToHz, pentatonicMidi, playTone } from './synthesis'

export interface ParkSoundscape {
  schedule: (until: number) => void
  setAmbience: (night: number, dawn: number, when: number) => void
}

interface Chord {
  root: number
  voicing: readonly number[]
}

interface PendingNote {
  time: number
  midi: number
  velocity: number
}

const beatSeconds = 60 / 58
const padPeak = 0.017
const bassPeak = 0.03
const rumbleCutoff = 55
const chordBeatsPool: readonly number[] = [12, 16, 16, 20]
const breathBeats = 12
const breathGapRange: readonly [number, number] = [60, 120]
const padAirLevel = 0.4
const padDayCutoff = 1400
const padNightDrop = 380
const voicingLow = 50
const voicingHigh = 69
const melodyLow = 0
const melodyHigh = 9
const rhythmPool: readonly number[] = [0.5, 1, 1, 1, 1.5, 2, 2]
const stepPool: readonly number[] = [-2, -1, -1, 0, 1, 1, 2]

const brightProgression: readonly Chord[] = [
  { root: 38, voicing: [54, 57, 61, 64] },
  { root: 43, voicing: [54, 59, 62, 64] },
  { root: 47, voicing: [50, 54, 57, 61] },
  { root: 45, voicing: [52, 57, 59, 64] },
]

const mellowProgression: readonly Chord[] = [
  { root: 40, voicing: [55, 59, 62, 66] },
  { root: 43, voicing: [54, 59, 62, 64] },
  { root: 38, voicing: [52, 54, 59, 61] },
  { root: 47, voicing: [50, 54, 57, 61] },
]

function pick<T>(graph: AudioGraph, pool: readonly T[]): T {
  return pool[Math.floor(graph.random() * pool.length)]
}

function clampDegree(degree: number): number {
  return Math.max(melodyLow, Math.min(melodyHigh, degree))
}

function voicingFor(graph: AudioGraph, chord: Chord): number[] {
  const notes = [...chord.voicing].sort((low, high) => low - high)
  const rotations = Math.floor(graph.random() * 3)
  for (let turn = 0; turn < rotations; turn += 1) {
    const lowest = notes.shift() as number
    notes.push(lowest + 12)
  }
  while (notes[notes.length - 1] > voicingHigh && notes[0] - 12 >= voicingLow - 2) {
    const highest = notes.pop() as number
    notes.unshift(highest - 12)
  }
  if (graph.random() < 0.3) notes.splice(1 + Math.floor(graph.random() * (notes.length - 1)), 1)
  return notes
}

export function createParkSoundscape(graph: AudioGraph, startAt: number): ParkSoundscape {
  const context = graph.context
  const musical = context.createGain()
  musical.gain.value = 1
  const rumbleFilter = context.createBiquadFilter()
  rumbleFilter.type = 'highpass'
  rumbleFilter.frequency.value = rumbleCutoff
  rumbleFilter.Q.value = 0.6
  const nightTrim = context.createGain()
  musical.connect(rumbleFilter)
  rumbleFilter.connect(nightTrim)
  nightTrim.connect(graph.music)
  const musicalSend = context.createGain()
  musicalSend.gain.value = 0.6
  nightTrim.connect(musicalSend)
  musicalSend.connect(graph.reverb)

  const ambient = context.createGain()
  ambient.gain.value = 1
  ambient.connect(graph.music)

  const padFilter = context.createBiquadFilter()
  padFilter.type = 'lowpass'
  padFilter.frequency.value = padDayCutoff
  padFilter.Q.value = 0.4
  padFilter.connect(musical)
  const padSweep = context.createOscillator()
  padSweep.frequency.value = 0.045
  const padSweepDepth = context.createGain()
  padSweepDepth.gain.value = 220
  padSweep.connect(padSweepDepth)
  padSweepDepth.connect(padFilter.frequency)

  const pluckFilter = context.createBiquadFilter()
  pluckFilter.type = 'lowpass'
  pluckFilter.frequency.value = 3200
  pluckFilter.Q.value = 0.3
  pluckFilter.connect(musical)

  const breeze = context.createBufferSource()
  breeze.buffer = graph.pinkNoise
  breeze.loop = true
  const breezeFilter = context.createBiquadFilter()
  breezeFilter.type = 'lowpass'
  breezeFilter.frequency.value = 620
  breezeFilter.Q.value = 0.3
  const breezeLevel = context.createGain()
  breezeLevel.gain.value = 0.05
  const breezeSwell = context.createOscillator()
  breezeSwell.frequency.value = 0.07
  const breezeSwellDepth = context.createGain()
  breezeSwellDepth.gain.value = 0.032
  const breezeTone = context.createOscillator()
  breezeTone.frequency.value = 0.113
  const breezeToneDepth = context.createGain()
  breezeToneDepth.gain.value = 260
  breeze.connect(breezeFilter)
  breezeFilter.connect(breezeLevel)
  breezeLevel.connect(ambient)
  breezeSwell.connect(breezeSwellDepth)
  breezeSwellDepth.connect(breezeLevel.gain)
  breezeTone.connect(breezeToneDepth)
  breezeToneDepth.connect(breezeFilter.frequency)

  const persistent: AudioScheduledSourceNode[] = [padSweep, breeze, breezeSwell, breezeTone]
  persistent.forEach((source) => source.start(startAt))
  musical.gain.setValueAtTime(0, startAt)
  musical.gain.linearRampToValueAtTime(1, startAt + 5)
  ambient.gain.setValueAtTime(0, startAt)
  ambient.gain.linearRampToValueAtTime(1, startAt + 3)

  const birdsong = createBirdsong(graph, ambient, startAt)
  let night = 0
  let dawn = 0
  let chordIndex = 0
  let progression = brightProgression
  let nextChordAt = startAt
  let nextBreathAt = startAt + between(graph, breathGapRange[0], breathGapRange[1])
  let breathUntil = 0
  let nextPhraseAt = startAt + beatSeconds * 4
  let degree = 4
  let lastRhythm: number[] | null = null
  let lastDegrees: number[] | null = null
  let pending: PendingNote[] = []

  const padNote = (midi: number, start: number, length: number, peak: number) => {
    const frequency = midiToHz(midi)
    const envelope = context.createGain()
    envelope.gain.value = 0
    envelope.gain.setValueAtTime(0, start)
    envelope.gain.linearRampToValueAtTime(peak, start + 3.5)
    envelope.gain.setValueAtTime(peak, start + length)
    envelope.gain.linearRampToValueAtTime(0, start + length + 4.5)
    envelope.connect(padFilter)
    const warm = context.createOscillator()
    warm.type = 'triangle'
    warm.frequency.value = frequency
    warm.detune.value = -6
    const pure = context.createOscillator()
    pure.frequency.value = frequency
    pure.detune.value = 5
    const pureLevel = context.createGain()
    pureLevel.gain.value = 0.7
    const air = context.createOscillator()
    air.frequency.value = frequency * 2
    air.detune.value = between(graph, -4, 4)
    const airLevel = context.createGain()
    airLevel.gain.value = padAirLevel
    warm.connect(envelope)
    pure.connect(pureLevel)
    pureLevel.connect(envelope)
    air.connect(airLevel)
    airLevel.connect(envelope)
    const end = start + length + 4.6
    warm.start(start)
    pure.start(start)
    air.start(start)
    warm.stop(end)
    pure.stop(end)
    air.stop(end)
  }

  const bassNote = (midi: number, start: number, length: number) => {
    const envelope = context.createGain()
    envelope.gain.value = 0
    envelope.gain.setValueAtTime(0, start)
    envelope.gain.linearRampToValueAtTime(bassPeak, start + 2)
    envelope.gain.setValueAtTime(bassPeak, start + length)
    envelope.gain.linearRampToValueAtTime(0, start + length + 3)
    envelope.connect(musical)
    const low = context.createOscillator()
    low.frequency.value = midiToHz(midi)
    const body = context.createOscillator()
    body.type = 'triangle'
    body.frequency.value = midiToHz(midi + 12)
    const bodyLevel = context.createGain()
    bodyLevel.gain.value = 0.5
    const overtone = context.createOscillator()
    overtone.frequency.value = midiToHz(midi + 24)
    const overtoneLevel = context.createGain()
    overtoneLevel.gain.value = 0.22
    low.connect(envelope)
    body.connect(bodyLevel)
    bodyLevel.connect(envelope)
    overtone.connect(overtoneLevel)
    overtoneLevel.connect(envelope)
    const end = start + length + 3.1
    low.start(start)
    body.start(start)
    overtone.start(start)
    low.stop(end)
    body.stop(end)
    overtone.stop(end)
  }

  const pluck = (midi: number, when: number, velocity: number) => {
    const frequency = midiToHz(midi)
    const level = (1 - night * 0.35) * velocity
    playTone(graph, pluckFilter, when, { frequency, attack: 0.005, decay: 1.7, peak: 0.15 * level })
    playTone(graph, pluckFilter, when, { frequency: frequency * 3, attack: 0.003, decay: 0.2, peak: 0.022 * level })
    playTone(graph, pluckFilter, when, { type: 'triangle', frequency, attack: 0.008, decay: 0.9, peak: 0.045 * level, filter: 1600 })
  }

  const chooseProgression = () => {
    const switchChance = 0.45 + night * 0.3
    if (graph.random() < switchChance) progression = progression === brightProgression ? mellowProgression : brightProgression
    if (night > 0.5 && graph.random() < night * 0.5) progression = mellowProgression
  }

  const startChord = (start: number): number => {
    if (start >= nextBreathAt) {
      nextBreathAt = start + between(graph, breathGapRange[0], breathGapRange[1])
      const breathLength = (breathBeats + Math.floor(graph.random() * 5)) * beatSeconds
      breathUntil = start + breathLength
      return breathLength
    }
    if (chordIndex % progression.length === 0 && chordIndex > 0) chooseProgression()
    const chord = progression[chordIndex % progression.length]
    chordIndex += 1
    const length = pick(graph, chordBeatsPool) * beatSeconds
    const padLead = start - 1.2
    const padStart = Math.max(context.currentTime, padLead)
    const peak = padPeak * between(graph, 0.8, 1.1)
    voicingFor(graph, chord).forEach((midi) => padNote(midi, padStart, length + padLead - padStart, peak))
    bassNote(chord.root, start, length - 1)
    if (graph.random() < 0.4) pluck(pentatonicMidi(Math.floor(between(graph, 10, 14))), start + beatSeconds * 2, 0.35)
    return length
  }

  const composePhrase = (start: number) => {
    const reuse = lastRhythm !== null && lastDegrees !== null && graph.random() < 0.35
    const rhythm: number[] = []
    const degrees: number[] = []
    if (reuse && lastRhythm && lastDegrees) {
      const shift = graph.random() < 0.5 ? -1 : 1
      lastRhythm.forEach((beats, index) => {
        rhythm.push(beats)
        degrees.push(clampDegree((lastDegrees as number[])[index] + shift))
      })
    } else {
      const count = 3 + Math.floor(graph.random() * 4)
      for (let note = 0; note < count; note += 1) {
        degree = clampDegree(degree + pick(graph, stepPool))
        rhythm.push(pick(graph, rhythmPool))
        degrees.push(degree)
      }
    }
    const register = graph.random() < night ? -2 : 0
    let cursor = start
    rhythm.forEach((beats, index) => {
      const time = cursor + between(graph, -0.012, 0.018)
      const accent = index === 0 ? 0.9 : between(graph, 0.5, 0.82)
      pending.push({ time, midi: pentatonicMidi(degrees[index] + register), velocity: accent })
      if (graph.random() < 0.22) pending.push({ time: time + 0.02, midi: pentatonicMidi(degrees[index] + register - 2), velocity: accent * 0.55 })
      cursor += beats * beatSeconds
    })
    lastRhythm = rhythm
    lastDegrees = degrees
    const restBeats = (3 + graph.random() * 6) * (1 + night * 1.3)
    nextPhraseAt = cursor + restBeats * beatSeconds
  }

  const schedule = (until: number) => {
    const now = context.currentTime
    if (nextChordAt < now - 1) nextChordAt = now + 0.1
    if (nextPhraseAt < now - 1) {
      nextPhraseAt = now + beatSeconds
      pending = []
    }
    while (nextChordAt < until) nextChordAt += startChord(nextChordAt)
    while (nextPhraseAt < until) {
      if (nextPhraseAt < breathUntil) nextPhraseAt = breathUntil + beatSeconds * between(graph, 0, 2)
      else composePhrase(nextPhraseAt)
    }
    if (pending.length > 0) {
      const remaining: PendingNote[] = []
      pending.forEach((note) => {
        if (note.time < until) {
          if (note.time >= now - 0.05) pluck(note.midi, Math.max(note.time, now), note.velocity)
        } else remaining.push(note)
      })
      pending = remaining
    }
    birdsong.schedule(until, night, dawn)
  }

  const setAmbience = (nextNight: number, nextDawn: number, when: number) => {
    night = Math.max(0, Math.min(1, nextNight))
    dawn = Math.max(0, Math.min(1, nextDawn))
    padFilter.frequency.setTargetAtTime(padDayCutoff - night * padNightDrop, when, 4)
    pluckFilter.frequency.setTargetAtTime(3200 - night * 1000, when, 4)
    breezeLevel.gain.setTargetAtTime(0.05 - night * 0.018, when, 4)
    nightTrim.gain.setTargetAtTime(1 - night * 0.18, when, 4)
  }

  return { schedule, setAmbience }
}
