import type { AudioGraph } from './audioGraph'
import type { SoundCue, SoundName } from './soundTypes'
import { bandpassInto, between, lowpassInto, midiToHz, pannedInto, pentatonicHz, playBell, playNoise, playSample, playTone } from './synthesis'

export interface Voice {
  graph: AudioGraph
  out: AudioNode
  when: number
  cue: SoundCue
}

export interface SoundRecipe {
  minGap: number
  space: number
  tuned?: boolean
  priority?: boolean
  trim?: number
  render: (voice: Voice) => number
}

function pop(voice: Voice, when: number, brightness: number): number {
  const { graph, out, cue } = voice
  const body = lowpassInto(graph, out, 2600)
  playTone(graph, body, when, { frequency: 640 * cue.pitch, endFrequency: 190 * cue.pitch, glide: 0.07, attack: 0.002, decay: 0.12, peak: 0.5 })
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 1700 * cue.pitch, q: 1.1, attack: 0.001, decay: 0.045, peak: 0.22 })
  return playBell(graph, lowpassInto(graph, out, 5200), when + 0.018, pentatonicHz(14 + brightness) * cue.pitch, 0.1, 0.32)
}

function coin(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const degree = 7 + Math.min(7, Math.max(0, Math.round(cue.step)))
  return playBell(graph, lowpassInto(graph, out, 6500), when, pentatonicHz(degree) * cue.pitch, 0.17, 0.34)
}

function purchase(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const soft = lowpassInto(graph, out, 6000)
  playTone(graph, out, when, { frequency: 170, endFrequency: 95, glide: 0.08, attack: 0.003, decay: 0.12, peak: 0.28 })
  playNoise(graph, out, when + 0.01, { filter: 'highpass', frequency: 5200, attack: 0.004, decay: 0.16, peak: 0.035 })
  playBell(graph, soft, when + 0.02, pentatonicHz(8) * cue.pitch, 0.2, 0.5)
  return playBell(graph, soft, when + 0.1, pentatonicHz(10) * cue.pitch, 0.2, 0.7)
}

function knock(voice: Voice, when: number, frequency: number, peak: number): number {
  const { graph, out, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: frequency * 1.9 * cue.pitch, q: 1.6, attack: 0.001, decay: 0.045, peak: peak * 0.55 })
  return playTone(graph, out, when, { frequency: frequency * cue.pitch, endFrequency: frequency * 0.72 * cue.pitch, glide: 0.05, attack: 0.0015, decay: 0.075, peak })
}

function deniedNote(voice: Voice, out: AudioNode, when: number, frequency: number, decay: number): number {
  playTone(voice.graph, out, when, { frequency: frequency * 2, endFrequency: frequency * 1.93, attack: 0.008, decay: decay * 0.8, peak: 0.22 })
  return playTone(voice.graph, out, when, { type: 'triangle', frequency, endFrequency: frequency * 0.965, attack: 0.008, decay, peak: 0.3 })
}

function denied(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const muffle = lowpassInto(graph, out, 2100)
  deniedNote(voice, muffle, when, 330 * cue.pitch, 0.16)
  return deniedNote(voice, muffle, when + 0.11, 247 * cue.pitch, 0.24)
}

function chopStrike(voice: Voice, when: number, strength: number): void {
  const { graph, out, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: between(graph, 820, 1000) * cue.pitch, q: 2.4, attack: 0.001, decay: 0.08, peak: 0.42 * strength })
  playTone(graph, out, when, { frequency: 230 * cue.pitch, endFrequency: 125 * cue.pitch, glide: 0.06, attack: 0.001, decay: 0.1, peak: 0.42 * strength })
  playNoise(graph, out, when, { filter: 'highpass', frequency: 3200, attack: 0.0008, decay: 0.018, peak: 0.1 * strength })
  knock(voice, when, 610, 0.3 * strength)
}

function treeChop(voice: Voice): number {
  chopStrike(voice, voice.when + 0.04, 1)
  chopStrike(voice, voice.when + 0.3, 0.85)
  return voice.when + 0.45
}

function treeFall(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const weight = Math.min(1.3, Math.max(0.7, cue.intensity))
  const groan = bandpassInto(graph, out, 680, 5)
  playTone(graph, groan, when, { type: 'sawtooth', frequency: 118, endFrequency: 74, glide: 0.8, attack: 0.12, hold: 0.25, decay: 0.45, peak: 0.07, vibratoRate: 8.5, vibratoDepth: 5 })
  playNoise(graph, out, when + 0.25, { filter: 'bandpass', frequency: 2600, endFrequency: 900, q: 0.9, attack: 0.45, decay: 0.5, peak: 0.12, pink: true })
  const impact = when + 0.95
  playTone(graph, out, impact, { frequency: 92, endFrequency: 44, glide: 0.25, attack: 0.004, decay: 0.42, peak: 0.45 * weight })
  playNoise(graph, out, impact, { filter: 'lowpass', frequency: 420, q: 0.7, attack: 0.004, decay: 0.34, peak: 0.42 * weight, pink: true })
  playNoise(graph, out, impact, { filter: 'bandpass', frequency: 950, endFrequency: 480, q: 1, attack: 0.003, decay: 0.3, peak: 0.42 * weight, pink: true })
  knock(voice, impact, 540, 0.42 * weight)
  knock(voice, impact + 0.11, 620, 0.18 * weight)
  return playNoise(graph, out, impact + 0.02, { filter: 'highpass', frequency: 3000, attack: 0.03, decay: 0.6, peak: 0.07, pink: true })
}

function gravelGrains(voice: Voice, count: number, spread: number, peak: number): number {
  const { graph, out, when } = voice
  let end = when
  for (let grain = 0; grain < count; grain += 1) {
    end = Math.max(end, playNoise(graph, out, when + graph.random() * spread, { filter: 'bandpass', frequency: between(graph, 1900, 4200), q: 1.6, attack: 0.001, decay: between(graph, 0.02, 0.05), peak: peak * between(graph, 0.6, 1) }))
  }
  return end
}

function pathGravel(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playTone(graph, out, when, { frequency: 150 * cue.pitch, endFrequency: 80, glide: 0.05, attack: 0.002, decay: 0.07, peak: 0.2 })
  return gravelGrains(voice, 6, 0.09, 0.17)
}

function pathStone(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 1250 * cue.pitch, q: 3, attack: 0.001, decay: 0.035, peak: 0.16 })
  gravelGrains(voice, 2, 0.05, 0.08)
  return playTone(graph, out, when, { frequency: 340 * cue.pitch, endFrequency: 250 * cue.pitch, glide: 0.05, attack: 0.001, decay: 0.09, peak: 0.32 })
}

function pathErase(voice: Voice): number {
  const { graph, out, when } = voice
  return playNoise(graph, out, when, { filter: 'bandpass', frequency: 1900, endFrequency: 620, q: 1.2, attack: 0.03, decay: 0.2, peak: 0.5, pink: true })
}

function placeDrop(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const size = Math.min(1.6, Math.max(0.6, cue.intensity))
  playTone(graph, out, when, { frequency: (135 / Math.sqrt(size)) * cue.pitch, endFrequency: 55, glide: 0.12, attack: 0.002, decay: 0.22, peak: 0.55 })
  playNoise(graph, out, when + 0.004, { filter: 'bandpass', frequency: 620 * cue.pitch, q: 3.5, attack: 0.001, decay: 0.05, peak: 0.12 })
  knock(voice, when, 640 / Math.sqrt(size), 0.4)
  return playNoise(graph, out, when + 0.01, { filter: 'lowpass', frequency: 1800, endFrequency: 320, attack: 0.012, decay: 0.38, peak: 0.2 * size, pink: true })
}

function propBump(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 820 * cue.pitch, q: 2, attack: 0.001, decay: 0.04, peak: 0.1 })
  knock(voice, when, 560, 0.14)
  return playTone(graph, out, when, { frequency: 270 * cue.pitch, endFrequency: 205 * cue.pitch, glide: 0.05, attack: 0.002, decay: 0.08, peak: 0.22 })
}

function trash(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 3000, endFrequency: 480, q: 1.4, attack: 0.02, decay: 0.28, peak: 0.24 * cue.intensity, pink: true })
  playNoise(graph, out, when + 0.05, { filter: 'lowpass', frequency: 700, attack: 0.01, decay: 0.16, peak: 0.16, pink: true })
  return playTone(graph, out, when + 0.02, { frequency: 720 * cue.pitch, endFrequency: 300 * cue.pitch, glide: 0.12, attack: 0.004, decay: 0.13, peak: 0.1 })
}

function bloops(voice: Voice, count: number, spread: number, peak: number): number {
  const { graph, out, when, cue } = voice
  const soft = lowpassInto(graph, out, 2800)
  let end = when
  for (let drop = 0; drop < count; drop += 1) {
    const start = when + graph.random() * spread
    const frequency = between(graph, 480, 1050) * cue.pitch
    end = Math.max(end, playTone(graph, soft, start, { frequency, endFrequency: frequency * 1.7, glide: 0.035, attack: 0.002, decay: 0.06, peak: peak * between(graph, 0.6, 1) }))
  }
  return end
}

function splash(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const size = Math.min(1.3, Math.max(0.6, cue.intensity))
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 1600, endFrequency: 1100, q: 0.7, attack: 0.006, decay: 0.36, peak: 0.24 * size, pink: true })
  playNoise(graph, out, when, { filter: 'lowpass', frequency: 520, attack: 0.006, decay: 0.24, peak: 0.18 * size, pink: true })
  return bloops(voice, 5, 0.3, 0.1)
}

function drip(voice: Voice): number {
  return bloops(voice, 2, 0.12, 0.08)
}

function lap(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const soft = lowpassInto(graph, out, 2200)
  playTone(graph, soft, when, { frequency: 520 * cue.pitch, endFrequency: 900 * cue.pitch, glide: 0.04, attack: 0.003, decay: 0.06, peak: 0.12 })
  return playNoise(graph, out, when, { filter: 'bandpass', frequency: 2200, q: 2, attack: 0.002, decay: 0.03, peak: 0.04 })
}

function munch(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const soft = lowpassInto(graph, out, 4200)
  let end = when
  for (let bite = 0; bite < 3; bite += 1) {
    const start = when + bite * 0.12 + graph.random() * 0.03
    playNoise(graph, soft, start, { filter: 'bandpass', frequency: between(graph, 1400, 2500) * cue.pitch, q: 1, attack: 0.002, decay: 0.05, peak: 0.2 })
    end = playTone(graph, soft, start, { frequency: 190 * cue.pitch, endFrequency: 120, glide: 0.04, attack: 0.002, decay: 0.045, peak: 0.1 })
  }
  return end
}

function purr(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const rate = between(graph, 23, 27)
  const rumble = lowpassInto(graph, out, 260)
  playTone(graph, rumble, when, { type: 'sawtooth', frequency: 52 * cue.pitch, attack: 0.25, hold: 0.35, decay: 0.55, peak: 0.1, tremoloRate: rate, tremoloDepth: 0.9 })
  const throat = lowpassInto(graph, out, 900)
  playNoise(graph, throat, when, { filter: 'bandpass', frequency: 300 * cue.pitch, q: 0.75, attack: 0.25, hold: 0.35, decay: 0.55, peak: 1.05, pink: true, tremoloRate: rate, tremoloDepth: 0.95 })
  return playNoise(graph, throat, when, { filter: 'bandpass', frequency: 520 * cue.pitch, q: 1.4, attack: 0.25, hold: 0.35, decay: 0.55, peak: 0.4, pink: true, tremoloRate: rate, tremoloDepth: 0.95 })
}

function synthMeow(voice: Voice, when: number, from: number, peakAt: number, to: number, length: number, peak: number): number {
  const { graph, out, cue } = voice
  const formant = bandpassInto(graph, out, 1350, 1.6)
  const breath = lowpassInto(graph, out, 2400)
  playTone(graph, breath, when, { type: 'triangle', frequency: from * cue.pitch, endFrequency: peakAt * cue.pitch, glide: length * 0.45, attack: 0.03, hold: length * 0.3, decay: length * 0.55, peak: peak * 0.5 })
  return playTone(graph, formant, when, { type: 'sawtooth', frequency: from * cue.pitch, endFrequency: to * cue.pitch, glide: length, attack: 0.03, hold: length * 0.3, decay: length * 0.55, peak })
}

function trill(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const formant = bandpassInto(graph, out, 1500, 1.4)
  return playTone(graph, formant, when, { type: 'triangle', frequency: 560 * cue.pitch, endFrequency: 820 * cue.pitch, glide: 0.18, attack: 0.02, hold: 0.06, decay: 0.2, peak: 0.42, tremoloRate: 28, tremoloDepth: 0.7 })
}

function gulp(voice: Voice): number {
  const { graph, out, when, cue } = voice
  return playTone(graph, lowpassInto(graph, out, 2000), when, { frequency: 320 * cue.pitch, endFrequency: 560 * cue.pitch, glide: 0.035, attack: 0.002, decay: 0.06, peak: 0.16 })
}

function shake(voice: Voice): number {
  const { graph, out, when } = voice
  return playNoise(graph, out, when, { filter: 'bandpass', frequency: 1500, q: 1.1, attack: 0.03, hold: 0.12, decay: 0.2, peak: 0.12, tremoloRate: 17, tremoloDepth: 0.85 })
}

function meowSample(voice: Voice, rate: number, peak: number, offset: number, length: number, brightness: number): number | null {
  const buffer = voice.graph.samples.meow
  if (!buffer) return null
  const tone = voice.graph.context.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = brightness
  tone.connect(voice.out)
  return playSample(voice.graph, tone, voice.when, buffer, rate * voice.cue.pitch, peak, offset, length)
}

function request(voice: Voice): number {
  return meowSample(voice, between(voice.graph, 1.12, 1.32), 0.42, 0.02, 0.42, 6000) ?? synthMeow(voice, voice.when, 520, 760, 700, 0.22, 0.2)
}

function grumpy(voice: Voice): number {
  const fromSample = meowSample(voice, between(voice.graph, 0.76, 0.84), 0.5, 0.08, 0.46, 1700)
  if (fromSample !== null) {
    playNoise(voice.graph, voice.out, voice.when, { filter: 'lowpass', frequency: 380, attack: 0.03, hold: 0.12, decay: 0.2, peak: 0.08, tremoloRate: 30, tremoloDepth: 0.9, pink: true })
    return fromSample
  }
  return synthMeow(voice, voice.when, 300, 380, 250, 0.3, 0.24)
}

function yawn(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 950, endFrequency: 480, q: 4, attack: 0.28, hold: 0.1, decay: 0.7, peak: 0.12 * cue.intensity, pink: true })
  playTone(graph, lowpassInto(graph, out, 1400), when + 0.05, { type: 'triangle', frequency: 460 * cue.pitch, endFrequency: 300 * cue.pitch, glide: 0.75, attack: 0.22, hold: 0.1, decay: 0.6, peak: 0.07 * cue.intensity })
  playTone(graph, out, when + 0.55, { frequency: pentatonicHz(5) * cue.pitch, attack: 0.04, decay: 0.5, peak: 0.035 * cue.intensity })
  return playTone(graph, out, when + 0.8, { frequency: pentatonicHz(3) * cue.pitch, attack: 0.04, decay: 0.7, peak: 0.03 * cue.intensity })
}

function jingle(voice: Voice, when: number, count: number): void {
  const { graph, out } = voice
  const soft = lowpassInto(graph, out, 7500)
  for (let ring = 0; ring < count; ring += 1) {
    const start = when + ring * 0.05 + graph.random() * 0.02
    playTone(graph, soft, start, { frequency: between(graph, 2600, 3300), attack: 0.002, decay: 0.22, peak: 0.05 })
    playTone(graph, soft, start, { frequency: between(graph, 4100, 4600), attack: 0.002, decay: 0.12, peak: 0.025 })
  }
}

function arpeggio(voice: Voice, when: number, degrees: readonly number[], spacing: number, peak: number, decay: number): number {
  const { graph, out, cue } = voice
  const soft = lowpassInto(graph, out, 6000)
  let end = when
  degrees.forEach((degree, index) => {
    end = Math.max(end, playBell(graph, soft, when + index * spacing, pentatonicHz(degree) * cue.pitch, peak, decay))
  })
  return end
}

const collarDegrees = [5, 7, 9, 10]
const nameDegrees = [7, 9, 10]
const unlockDegrees = [5, 6, 8, 10]
const tierDegrees = [5, 7, 8, 9, 10, 12]
const tierChordMidi = [62, 66, 69]

function collar(voice: Voice): number {
  jingle(voice, voice.when, 4)
  const end = arpeggio(voice, voice.when + 0.06, collarDegrees, 0.085, 0.14, 0.8)
  const meowAt = { ...voice, when: voice.when + 0.42 }
  meowSample(meowAt, between(voice.graph, 1.0, 1.08), 0.34, 0, 0.7, 7000)
  return Math.max(end, voice.when + 1.2)
}

function nameConfirm(voice: Voice): number {
  jingle(voice, voice.when + 0.16, 2)
  return arpeggio(voice, voice.when, nameDegrees, 0.09, 0.15, 0.9)
}

function nameTag(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playTone(graph, lowpassInto(graph, out, 3000), when, { frequency: 880 * cue.pitch, endFrequency: 1500 * cue.pitch, glide: 0.03, attack: 0.002, decay: 0.05, peak: 0.13 })
  return playBell(graph, lowpassInto(graph, out, 6000), when + 0.03, pentatonicHz(14) * cue.pitch, 0.09, 0.36)
}

function shimmer(voice: Voice, when: number, length: number, peak: number): number {
  return playNoise(voice.graph, lowpassInto(voice.graph, lowpassInto(voice.graph, voice.out, 10000), 10000), when, { filter: 'highpass', frequency: 6200, attack: length * 0.3, decay: length * 0.7, peak })
}

function unlock(voice: Voice): number {
  shimmer(voice, voice.when, 0.7, 0.03)
  return arpeggio(voice, voice.when, unlockDegrees, 0.075, 0.15, 0.7)
}

function tierUp(voice: Voice): number {
  const { graph, out, when } = voice
  const warm = lowpassInto(graph, out, 1500)
  tierChordMidi.forEach((midi, index) => {
    playTone(graph, warm, when + index * 0.02, { type: 'triangle', frequency: midiToHz(midi), attack: 0.09, hold: 0.2, decay: 1.2, peak: 0.08 })
  })
  shimmer(voice, when + 0.1, 1, 0.035)
  return arpeggio(voice, when, tierDegrees, 0.065, 0.14, 0.9)
}

function uiTap(voice: Voice): number {
  const { graph, out, when, cue } = voice
  playNoise(graph, out, when, { filter: 'highpass', frequency: 4200, attack: 0.0008, decay: 0.008, peak: 0.035 })
  return playTone(graph, out, when, { frequency: 1350 * cue.pitch, endFrequency: 1080 * cue.pitch, glide: 0.025, attack: 0.001, decay: 0.035, peak: 0.12 })
}

function flutter(voice: Voice): number {
  const { graph, out, when } = voice
  let end = when
  for (let flap = 0; flap < 9; flap += 1) {
    end = playNoise(graph, out, when + flap * 0.034 + graph.random() * 0.008, { filter: 'bandpass', frequency: between(graph, 900, 1500), q: 0.9, attack: 0.002, decay: 0.03, peak: 0.12 * (1 - flap / 12) })
  }
  return end
}

function rustle(voice: Voice): number {
  const { graph, out, when, cue } = voice
  const amount = Math.min(1.3, Math.max(0.5, cue.intensity))
  playNoise(graph, out, when, { filter: 'bandpass', frequency: 3600, q: 0.7, attack: 0.06, decay: 0.3, peak: 0.07 * amount, pink: true })
  return playNoise(graph, out, when + 0.12, { filter: 'bandpass', frequency: 2800, q: 0.7, attack: 0.08, decay: 0.42, peak: 0.06 * amount, pink: true })
}

function bubbles(voice: Voice): number {
  return bloops(voice, 3, 0.25, 0.06)
}

export const soundLibrary: Record<SoundName, SoundRecipe> = {
  ballPop: { trim: 1.5, minGap: 0.06, space: 0.12, render: (voice) => pop(voice, voice.when, 0) },
  ballSteal: {
    tuned: true,
    minGap: 0.08,
    space: 0.16,
    render: (voice) => {
      pop(voice, voice.when, 0)
      return arpeggio(voice, voice.when + 0.05, [10, 12, 14], 0.06, 0.12, 0.42)
    },
  },
  coin: { trim: 3, tuned: true, minGap: 0.04, space: 0.1, render: coin },
  purchase: { priority: true, trim: -1, tuned: true, minGap: 0.12, space: 0.14, render: purchase },
  denied: { priority: true, trim: -2, minGap: 0.35, space: 0.05, render: denied },
  treeChop: { trim: -2, minGap: 0.2, space: 0.12, render: treeChop },
  treeFall: { trim: -3.5, minGap: 0.4, space: 0.16, render: treeFall },
  pathGravel: { trim: 6, minGap: 0.07, space: 0.06, render: pathGravel },
  pathStone: { trim: 3, minGap: 0.07, space: 0.06, render: pathStone },
  pathErase: { trim: 4, minGap: 0.1, space: 0.06, render: pathErase },
  placeDrop: { trim: -1, minGap: 0.1, space: 0.1, render: placeDrop },
  propBump: { trim: 6, minGap: 0.12, space: 0.08, render: propBump },
  trash: { trim: 8, minGap: 0.2, space: 0.1, render: trash },
  splash: { trim: 6, minGap: 0.25, space: 0.16, render: splash },
  drip: { trim: 6, minGap: 0.25, space: 0.12, render: drip },
  lap: { trim: 7, minGap: 0.3, space: 0.08, render: lap },
  munch: { trim: 4, minGap: 0.45, space: 0.06, render: munch },
  purr: { trim: -3, minGap: 1.4, space: 0.04, render: purr },
  trill: { trim: 3, minGap: 0.5, space: 0.12, render: trill },
  gulp: { trim: 6, minGap: 0.2, space: 0.06, render: gulp },
  shake: { trim: 4, minGap: 0.5, space: 0.06, render: shake },
  request: { trim: -2, minGap: 1.2, space: 0.14, render: request },
  yawn: { minGap: 1.5, space: 0.14, render: yawn },
  grumpy: { trim: -1, minGap: 0.5, space: 0.1, render: grumpy },
  collar: { priority: true, trim: -2, tuned: true, minGap: 0.5, space: 0.18, render: collar },
  nameConfirm: { priority: true, trim: -2, tuned: true, minGap: 0.4, space: 0.18, render: nameConfirm },
  nameTag: { priority: true, trim: 3, minGap: 0.3, space: 0.14, render: nameTag },
  unlock: { priority: true, trim: -2, tuned: true, minGap: 0.4, space: 0.2, render: unlock },
  tierUp: { priority: true, trim: -4, tuned: true, minGap: 1, space: 0.22, render: tierUp },
  uiTap: { trim: 6, minGap: 0.035, space: 0.03, render: uiTap },
  flutter: { trim: 10, minGap: 0.6, space: 0.12, render: flutter },
  rustle: { trim: 12, minGap: 0.5, space: 0.1, render: rustle },
  bubbles: { trim: 4, minGap: 0.8, space: 0.14, render: bubbles },
}

export function renderSound(graph: AudioGraph, name: SoundName, when: number, cue: SoundCue, destination: AudioNode = graph.sfx): number {
  const recipe = soundLibrary[name]
  const context = graph.context
  const level = context.createGain()
  level.gain.value = cue.gain * Math.pow(10, (recipe.trim ?? 0) / 20)
  const panner = pannedInto(graph, destination, cue.pan)
  level.connect(panner)
  if (recipe.space > 0) {
    const send = context.createGain()
    send.gain.value = recipe.space
    panner.connect(send)
    send.connect(graph.reverb)
  }
  return recipe.render({ graph, out: level, when, cue })
}
