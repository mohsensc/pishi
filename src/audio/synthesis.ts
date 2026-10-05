import type { AudioGraph } from './audioGraph'

export interface ToneShape {
  frequency: number
  endFrequency?: number
  glide?: number
  type?: OscillatorType
  attack: number
  decay: number
  peak: number
  hold?: number
  filter?: number
  vibratoRate?: number
  vibratoDepth?: number
  tremoloRate?: number
  tremoloDepth?: number
}

export interface NoiseShape {
  filter: BiquadFilterType
  frequency: number
  endFrequency?: number
  q?: number
  attack: number
  decay: number
  peak: number
  hold?: number
  pink?: boolean
  tremoloRate?: number
  tremoloDepth?: number
}

const silence = 0.0001
const tail = 0.03

export function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

const pentatonicSteps = [0, 2, 4, 7, 9]

export function pentatonicMidi(degree: number, root = 62): number {
  const octave = Math.floor(degree / 5)
  const step = ((degree % 5) + 5) % 5
  return root + octave * 12 + pentatonicSteps[step]
}

export function pentatonicHz(degree: number, root = 62): number {
  return midiToHz(pentatonicMidi(degree, root))
}

export function shapeGain(gain: AudioParam, when: number, attack: number, hold: number, decay: number, peak: number): number {
  const attackEnd = when + Math.max(0.001, attack)
  const holdEnd = attackEnd + Math.max(0, hold)
  const end = holdEnd + Math.max(0.01, decay)
  gain.value = 0
  gain.setValueAtTime(0, when)
  gain.linearRampToValueAtTime(peak, attackEnd)
  if (hold > 0) gain.setValueAtTime(peak, holdEnd)
  gain.exponentialRampToValueAtTime(Math.max(silence, peak * 0.001), end)
  gain.linearRampToValueAtTime(0, end + tail)
  return end + tail
}

function addTremolo(graph: AudioGraph, target: GainNode, when: number, end: number, rate: number, depth: number): void {
  const context = graph.context
  const lfo = context.createOscillator()
  lfo.frequency.value = rate
  const lfoDepth = context.createGain()
  lfoDepth.gain.value = depth * 0.5
  target.gain.value = 1 - depth * 0.5
  lfo.connect(lfoDepth)
  lfoDepth.connect(target.gain)
  lfo.start(when)
  lfo.stop(end + 0.05)
}

export function playTone(graph: AudioGraph, destination: AudioNode, when: number, shape: ToneShape): number {
  const context = graph.context
  const oscillator = context.createOscillator()
  oscillator.type = shape.type ?? 'sine'
  oscillator.frequency.setValueAtTime(shape.frequency, when)
  if (shape.endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, shape.endFrequency), when + Math.max(0.005, shape.glide ?? shape.attack + shape.decay * 0.5))
  }
  const envelope = context.createGain()
  const end = shapeGain(envelope.gain, when, shape.attack, shape.hold ?? 0, shape.decay, shape.peak)
  let head: AudioNode = oscillator
  if (shape.filter) {
    const lowpass = context.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = shape.filter
    lowpass.Q.value = 0.5
    head.connect(lowpass)
    head = lowpass
  }
  head.connect(envelope)
  if (shape.tremoloRate && shape.tremoloDepth) {
    const tremolo = context.createGain()
    addTremolo(graph, tremolo, when, end, shape.tremoloRate, shape.tremoloDepth)
    envelope.connect(tremolo)
    tremolo.connect(destination)
  } else envelope.connect(destination)
  if (shape.vibratoRate && shape.vibratoDepth) {
    const vibrato = context.createOscillator()
    vibrato.frequency.value = shape.vibratoRate
    const vibratoDepth = context.createGain()
    vibratoDepth.gain.value = shape.vibratoDepth
    vibrato.connect(vibratoDepth)
    vibratoDepth.connect(oscillator.frequency)
    vibrato.start(when)
    vibrato.stop(end + 0.05)
  }
  oscillator.start(when)
  oscillator.stop(end + 0.05)
  return end
}

export function playNoise(graph: AudioGraph, destination: AudioNode, when: number, shape: NoiseShape): number {
  const context = graph.context
  const buffer = shape.pink ? graph.pinkNoise : graph.whiteNoise
  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = shape.filter
  filter.frequency.setValueAtTime(shape.frequency, when)
  filter.Q.value = shape.q ?? 0.8
  const envelope = context.createGain()
  const end = shapeGain(envelope.gain, when, shape.attack, shape.hold ?? 0, shape.decay, shape.peak)
  if (shape.endFrequency !== undefined) filter.frequency.exponentialRampToValueAtTime(Math.max(30, shape.endFrequency), end)
  source.connect(filter)
  filter.connect(envelope)
  if (shape.tremoloRate && shape.tremoloDepth) {
    const tremolo = context.createGain()
    addTremolo(graph, tremolo, when, end, shape.tremoloRate, shape.tremoloDepth)
    envelope.connect(tremolo)
    tremolo.connect(destination)
  } else envelope.connect(destination)
  source.start(when, graph.random() * (buffer.duration - 0.5))
  source.stop(end + 0.05)
  return end
}

export function playBell(graph: AudioGraph, destination: AudioNode, when: number, frequency: number, peak: number, decay: number): number {
  const body = playTone(graph, destination, when, { frequency, attack: 0.003, decay, peak })
  playTone(graph, destination, when, { frequency: frequency * 2.0, attack: 0.002, decay: decay * 0.4, peak: peak * 0.22 })
  playTone(graph, destination, when, { frequency: frequency * 3.01, attack: 0.002, decay: decay * 0.18, peak: peak * 0.08 })
  return body
}

export function playSample(graph: AudioGraph, destination: AudioNode, when: number, buffer: AudioBuffer, rate: number, peak: number, offset = 0, length = buffer.duration): number {
  const context = graph.context
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = rate
  const envelope = context.createGain()
  const realLength = Math.min(length, (buffer.duration - offset) / rate)
  const fade = Math.min(0.12, realLength * 0.3)
  envelope.gain.value = 0
  envelope.gain.setValueAtTime(0, when)
  envelope.gain.linearRampToValueAtTime(peak, when + 0.01)
  envelope.gain.setValueAtTime(peak, when + realLength - fade)
  envelope.gain.linearRampToValueAtTime(0, when + realLength)
  source.connect(envelope)
  envelope.connect(destination)
  source.start(when, offset)
  source.stop(when + realLength + 0.02)
  return when + realLength
}

export function lowpassInto(graph: AudioGraph, destination: AudioNode, frequency: number, q = 0.6): BiquadFilterNode {
  const filter = graph.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = frequency
  filter.Q.value = q
  filter.connect(destination)
  return filter
}

export function bandpassInto(graph: AudioGraph, destination: AudioNode, frequency: number, q: number): BiquadFilterNode {
  const filter = graph.context.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = frequency
  filter.Q.value = q
  filter.connect(destination)
  return filter
}

export function between(graph: AudioGraph, low: number, high: number): number {
  return low + (high - low) * graph.random()
}

export function pannedInto(graph: AudioGraph, destination: AudioNode, pan: number): AudioNode {
  const context = graph.context
  if (typeof context.createStereoPanner !== 'function') {
    const passthrough = context.createGain()
    passthrough.connect(destination)
    return passthrough
  }
  const panner = context.createStereoPanner()
  panner.pan.value = Number.isFinite(pan) ? Math.max(-1, Math.min(1, pan)) : 0
  panner.connect(destination)
  return panner
}
