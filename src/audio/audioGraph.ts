export type RandomSource = () => number

export interface AudioSamples {
  meow: AudioBuffer | null
}

export interface AudioGraph {
  context: BaseAudioContext
  sfx: GainNode
  music: GainNode
  reverb: GainNode
  output: GainNode
  whiteNoise: AudioBuffer
  pinkNoise: AudioBuffer
  samples: AudioSamples
  random: RandomSource
}

export const musicLevel = 0.39
export const sfxLevel = 0.9

const noiseSeconds = 3
const reverbSeconds = 2.6
const reverbReturnLevel = 0.42

function fillWhiteNoise(buffer: AudioBuffer, random: RandomSource): void {
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let index = 0; index < data.length; index += 1) data[index] = random() * 2 - 1
  }
}

function fillPinkNoise(buffer: AudioBuffer, random: RandomSource): void {
  const data = buffer.getChannelData(0)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let b3 = 0
  let b4 = 0
  let b5 = 0
  let b6 = 0
  for (let index = 0; index < data.length; index += 1) {
    const white = random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    data[index] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
    b6 = white * 0.115926
  }
  const fade = Math.min(data.length >> 1, 2048)
  for (let index = 0; index < fade; index += 1) {
    const blend = index / fade
    const tail = data.length - fade + index
    data[tail] = data[tail] * (1 - blend) + data[index] * blend
  }
}

function buildReverbImpulse(context: BaseAudioContext, random: RandomSource): AudioBuffer {
  const length = Math.floor(context.sampleRate * reverbSeconds)
  const impulse = context.createBuffer(2, length, context.sampleRate)
  const predelay = Math.floor(context.sampleRate * 0.018)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel)
    let smoothed = 0
    for (let index = predelay; index < length; index += 1) {
      const progress = (index - predelay) / (length - predelay)
      const darkening = 0.35 + 0.5 * progress
      smoothed += ((random() * 2 - 1) - smoothed) * (1 - darkening)
      data[index] = smoothed * Math.pow(1 - progress, 2.4) * 0.9
    }
  }
  return impulse
}

export function buildAudioGraph(context: BaseAudioContext, random: RandomSource = Math.random): AudioGraph {
  const sampleRate = context.sampleRate
  const whiteNoise = context.createBuffer(1, Math.floor(sampleRate * noiseSeconds), sampleRate)
  fillWhiteNoise(whiteNoise, random)
  const pinkNoise = context.createBuffer(1, Math.floor(sampleRate * noiseSeconds), sampleRate)
  fillPinkNoise(pinkNoise, random)

  const sfx = context.createGain()
  sfx.gain.value = sfxLevel
  const music = context.createGain()
  music.gain.value = musicLevel
  const reverb = context.createGain()
  const convolver = context.createConvolver()
  convolver.buffer = buildReverbImpulse(context, random)
  const reverbReturn = context.createGain()
  reverbReturn.gain.value = reverbReturnLevel
  const glue = context.createDynamicsCompressor()
  glue.threshold.value = -20
  glue.knee.value = 12
  glue.ratio.value = 2.5
  glue.attack.value = 0.012
  glue.release.value = 0.28
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -4
  limiter.knee.value = 0
  limiter.ratio.value = 20
  limiter.attack.value = 0.002
  limiter.release.value = 0.12
  const output = context.createGain()

  reverb.connect(convolver)
  convolver.connect(reverbReturn)
  sfx.connect(glue)
  music.connect(glue)
  reverbReturn.connect(glue)
  glue.connect(limiter)
  limiter.connect(output)
  output.connect(context.destination)

  return { context, sfx, music, reverb, output, whiteNoise, pinkNoise, samples: { meow: null }, random }
}
