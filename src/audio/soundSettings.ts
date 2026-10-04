const mutedKey = 'pishi.sound.muted'

type Listener = () => void

const listeners = new Set<Listener>()

function readStoredMuted(): boolean {
  try {
    return window.localStorage.getItem(mutedKey) === '1'
  } catch {
    return false
  }
}

function storeMuted(value: boolean): boolean {
  try {
    window.localStorage.setItem(mutedKey, value ? '1' : '0')
  } catch {
    return false
  }
  return true
}

let muted = typeof window === 'undefined' ? false : readStoredMuted()

export function isSoundMuted(): boolean {
  return muted
}

export function setSoundMuted(next: boolean): void {
  if (next === muted) return
  muted = next
  storeMuted(next)
  listeners.forEach((listener) => listener())
}

function syncFromOtherTab(event: StorageEvent): void {
  if (event.key !== mutedKey) return
  const next = event.newValue === '1'
  if (next === muted) return
  muted = next
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') window.addEventListener('storage', syncFromOtherTab)

export function subscribeSoundMuted(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
