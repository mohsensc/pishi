import { memo, useEffect, useSyncExternalStore } from 'react'
import { isSoundMuted, setSoundMuted, subscribeSoundMuted } from '../../audio/soundSettings'
import styles from './SoundToggle.module.css'

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function SpeakerGlyph({ muted }: { muted: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" fillOpacity="0.14" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
          <path d="M18.4 6.6a7.6 7.6 0 0 1 0 10.8" />
        </>
      )}
    </svg>
  )
}

function SoundToggle() {
  const muted = useSyncExternalStore(subscribeSoundMuted, isSoundMuted, () => false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (typeof event.key !== 'string' || event.key.toLowerCase() !== 'm' || event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      setSoundMuted(!isSoundMuted())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <button
      type="button"
      className={styles.toggle}
      data-ui
      data-muted={muted}
      aria-label="Mute sound"
      aria-pressed={muted}
      aria-keyshortcuts="M"
      title={muted ? 'Sound off (M)' : 'Sound on (M)'}
      onClick={() => setSoundMuted(!muted)}>
      <SpeakerGlyph muted={muted} />
    </button>
  )
}

export default memo(SoundToggle)
