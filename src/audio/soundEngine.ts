import meowUrl from './assets/meow.mp3'
import { buildAudioGraph, type AudioGraph } from './audioGraph'
import { createParkSoundscape, type ParkSoundscape } from './parkSoundscape'
import { renderSound, soundLibrary } from './soundLibrary'
import { isSoundMuted, subscribeSoundMuted } from './soundSettings'
import { neutralCue, type SoundCue, type SoundName } from './soundTypes'

const lookaheadSeconds = 1.5
const schedulerMs = 250
const maxVoices = 18
const reservedVoices = 3
const fadeSeconds = 0.25
const pitchWobble = 0.06
const gestureEvents = ['pointerdown', 'keydown', 'touchend'] as const

let context: AudioContext | null = null
let graph: AudioGraph | null = null
let soundscape: ParkSoundscape | null = null
let schedulerHandle: number | null = null
let suspendHandle: number | null = null
let installed = false
let night = 0
let dawn = 0
const voiceEnds = new Float64Array(maxVoices)
const lastPlayedAt: Partial<Record<SoundName, number>> = {}
const cue: SoundCue = { ...neutralCue }
const tapCue: Partial<SoundCue> = { pan: 0, gain: 1 }
const tapPanSpread = 0.5

interface AudioSessionNavigator {
  audioSession?: { type: string }
  userActivation?: { hasBeenActive: boolean }
}

function audible(): boolean {
  return !isSoundMuted() && document.visibilityState === 'visible'
}

async function loadMeow(target: AudioGraph): Promise<void> {
  try {
    const response = await fetch(meowUrl)
    const data = await response.arrayBuffer()
    target.samples.meow = await target.context.decodeAudioData(data)
  } catch {
    target.samples.meow = null
  }
}

function preferAmbientSession(): void {
  try {
    const session = (navigator as Navigator & AudioSessionNavigator).audioSession
    if (session) session.type = 'ambient'
  } catch {
    return
  }
}

function ensureContext(): AudioContext | null {
  if (context) return context
  preferAmbientSession()
  const audioWindow = window as Window & { webkitAudioContext?: typeof AudioContext }
  const AudioContextClass = window.AudioContext ?? audioWindow.webkitAudioContext
  if (!AudioContextClass) return null
  try {
    const created = new AudioContextClass({ latencyHint: 'interactive' })
    graph = buildAudioGraph(created)
    graph.output.gain.value = 0
    soundscape = createParkSoundscape(graph, created.currentTime + 0.1)
    soundscape.setAmbience(night, dawn, created.currentTime)
    context = created
  } catch {
    graph = null
    soundscape = null
    return null
  }
  void loadMeow(graph)
  return context
}

function scheduleAhead(): void {
  if (!context || !soundscape || context.state !== 'running') return
  try {
    soundscape.schedule(context.currentTime + lookaheadSeconds)
  } catch {
    return
  }
}

function startScheduler(): void {
  if (schedulerHandle !== null) return
  scheduleAhead()
  schedulerHandle = window.setInterval(scheduleAhead, schedulerMs)
}

function stopScheduler(): void {
  if (schedulerHandle === null) return
  window.clearInterval(schedulerHandle)
  schedulerHandle = null
}

function rampOutput(target: number, seconds: number): void {
  if (!context || !graph) return
  const gain = graph.output.gain
  const now = context.currentTime
  gain.cancelScheduledValues(now)
  gain.setValueAtTime(gain.value, now)
  gain.linearRampToValueAtTime(target, now + seconds)
}

function wake(): void {
  const active = ensureContext()
  if (!active) return
  if (suspendHandle !== null) {
    window.clearTimeout(suspendHandle)
    suspendHandle = null
  }
  active
    .resume()
    .then(() => {
      if (!audible()) return
      rampOutput(1, 0.6)
      startScheduler()
    })
    .catch(() => undefined)
}

function rest(): void {
  if (!context) return
  rampOutput(0, fadeSeconds)
  stopScheduler()
  if (suspendHandle !== null) window.clearTimeout(suspendHandle)
  const sleeping = context
  suspendHandle = window.setTimeout(() => {
    suspendHandle = null
    if (!audible()) sleeping.suspend().catch(() => undefined)
  }, fadeSeconds * 1000 + 80)
}

function refresh(): void {
  if (!audible()) rest()
  else if (context) wake()
}

function handleGesture(): void {
  if (isSoundMuted()) return
  if (context && context.state === 'running' && schedulerHandle !== null) return
  wake()
}

function handleInterfaceTap(event: PointerEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest('button')
  if (!button || button.disabled) return
  tapCue.pan = ((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1) * tapPanSpread
  playSound('uiTap', tapCue)
}

export function installSoundEngine(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  gestureEvents.forEach((eventName) => window.addEventListener(eventName, handleGesture, { capture: true, passive: true }))
  window.addEventListener('pointerdown', handleInterfaceTap, { capture: true, passive: true })
  document.addEventListener('visibilitychange', refresh)
  subscribeSoundMuted(() => {
    if (isSoundMuted()) rest()
    else wake()
  })
  if (!isSoundMuted() && (navigator as Navigator & AudioSessionNavigator).userActivation?.hasBeenActive) wake()
}

export function setSoundAmbience(nextNight: number, nextDawn: number): void {
  night = nextNight
  dawn = nextDawn
  if (context && soundscape) soundscape.setAmbience(night, dawn, context.currentTime)
}

function freeVoiceSlot(now: number, priority: boolean): number {
  const limit = priority ? maxVoices : maxVoices - reservedVoices
  for (let slot = 0; slot < limit; slot += 1) {
    if (voiceEnds[slot] <= now) return slot
  }
  return -1
}

export function playSound(name: SoundName, overrides?: Partial<SoundCue>): void {
  if (!context || !graph || context.state !== 'running' || schedulerHandle === null) return
  const now = context.currentTime
  const recipe = soundLibrary[name]
  const when = now + 0.01 + finiteOr(overrides?.delay, 0)
  const previous = lastPlayedAt[name]
  if (previous !== undefined && Math.abs(when - previous) < recipe.minGap) return
  const slot = freeVoiceSlot(now, recipe.priority === true)
  if (slot < 0) return
  lastPlayedAt[name] = when
  cue.pan = finiteOr(overrides?.pan, neutralCue.pan)
  cue.gain = Math.max(0, finiteOr(overrides?.gain, neutralCue.gain)) * (0.9 + Math.random() * 0.1)
  cue.pitch = Math.max(0.25, finiteOr(overrides?.pitch, neutralCue.pitch)) * (1 + (Math.random() - 0.5) * (recipe.tuned ? 0 : pitchWobble))
  cue.intensity = finiteOr(overrides?.intensity, neutralCue.intensity)
  cue.delay = 0
  cue.step = finiteOr(overrides?.step, neutralCue.step)
  try {
    voiceEnds[slot] = renderSound(graph, name, when, cue)
  } catch {
    voiceEnds[slot] = now
  }
}

function finiteOr(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}
