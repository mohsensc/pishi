import { useCallback, useEffect, useState } from 'react'
import type { PathStyle } from '../game/types'

export type BuildMode = { kind: 'none' } | { kind: 'clearTrees' } | { kind: 'paintPath'; style: PathStyle } | { kind: 'erasePath' }

export type PathBrush = Extract<BuildMode, { kind: 'paintPath' | 'erasePath' }>

export interface BuildModeHandle {
  mode: BuildMode
  pathBrush: PathBrush
  setMode: (mode: BuildMode) => void
  toggleMode: (mode: BuildMode) => void
}

const idleMode: BuildMode = { kind: 'none' }
const defaultBrush: PathBrush = { kind: 'paintPath', style: 'gravel' }

function sameMode(first: BuildMode, second: BuildMode): boolean {
  return first.kind === second.kind && (first.kind !== 'paintPath' || second.kind !== 'paintPath' || first.style === second.style)
}

export function isPathMode(mode: BuildMode): mode is PathBrush {
  return mode.kind === 'paintPath' || mode.kind === 'erasePath'
}

export function useBuildMode(): BuildModeHandle {
  const [mode, setModeState] = useState<BuildMode>(idleMode)
  const [pathBrush, setPathBrush] = useState<PathBrush>(defaultBrush)

  const setMode = useCallback((next: BuildMode) => {
    setModeState(next)
    if (isPathMode(next)) setPathBrush(next)
  }, [])

  const toggleMode = useCallback(
    (next: BuildMode) => {
      setModeState((current) => (sameMode(current, next) ? idleMode : next))
      if (isPathMode(next)) setPathBrush(next)
    },
    [],
  )

  useEffect(() => {
    if (mode.kind === 'none') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModeState(idleMode)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode])

  return { mode, pathBrush, setMode, toggleMode }
}
