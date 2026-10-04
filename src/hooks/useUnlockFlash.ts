import { useEffect, useRef, useState } from 'react'

const flashMs = 1400

export function useUnlockFlash(unlockedKeys: readonly string[]): ReadonlySet<string> {
  const seenRef = useRef<Set<string> | null>(null)
  const [fresh, setFresh] = useState<ReadonlySet<string>>(() => new Set())
  const signature = unlockedKeys.join('|')

  useEffect(() => {
    const current = new Set(signature ? signature.split('|') : [])
    const seen = seenRef.current
    seenRef.current = current
    if (!seen) return
    const added = [...current].filter((key) => !seen.has(key))
    const show = window.setTimeout(() => setFresh(new Set(added)), 0)
    const hide = window.setTimeout(() => setFresh(new Set()), added.length > 0 ? flashMs : 0)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(hide)
    }
  }, [signature])

  return fresh
}
