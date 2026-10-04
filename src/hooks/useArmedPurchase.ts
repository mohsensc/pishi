import { useCallback, useEffect, useRef, useState } from 'react'
import type { ShopOffer } from '../game/types'

export type ArmedTapOutcome = 'armed' | 'bought' | 'denied'

const armedMs = 2000
const deniedMs = 420

export function useArmedPurchase() {
  const [armedKey, setArmedKey] = useState<string | null>(null)
  const [deniedKey, setDeniedKey] = useState<string | null>(null)
  const armedTimerRef = useRef<number | null>(null)
  const deniedTimerRef = useRef<number | null>(null)
  const armedRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (armedTimerRef.current !== null) window.clearTimeout(armedTimerRef.current)
      if (deniedTimerRef.current !== null) window.clearTimeout(deniedTimerRef.current)
    },
    [],
  )

  const disarm = useCallback(() => {
    armedRef.current = null
    setArmedKey(null)
    if (armedTimerRef.current !== null) window.clearTimeout(armedTimerRef.current)
  }, [])

  const deny = useCallback(
    (key: string) => {
      disarm()
      setDeniedKey(key)
      if (deniedTimerRef.current !== null) window.clearTimeout(deniedTimerRef.current)
      deniedTimerRef.current = window.setTimeout(() => setDeniedKey((current) => (current === key ? null : current)), deniedMs)
    },
    [disarm],
  )

  const arm = useCallback((key: string) => {
    armedRef.current = key
    setArmedKey(key)
    if (armedTimerRef.current !== null) window.clearTimeout(armedTimerRef.current)
    armedTimerRef.current = window.setTimeout(() => {
      armedRef.current = null
      setArmedKey((current) => (current === key ? null : current))
    }, armedMs)
  }, [])

  const tap = useCallback(
    (key: string, offer: ShopOffer, buy: () => boolean): ArmedTapOutcome => {
      if (offer.blocker !== null) {
        buy()
        deny(key)
        return 'denied'
      }
      if (armedRef.current !== key) {
        arm(key)
        return 'armed'
      }
      disarm()
      if (buy()) return 'bought'
      deny(key)
      return 'denied'
    },
    [arm, deny, disarm],
  )

  return { armedKey, deniedKey, tap, disarm }
}
