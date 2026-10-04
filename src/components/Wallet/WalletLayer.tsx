import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { DeniedEvent, TokenEvent, Vec } from '../../game/types'
import { playCoinLanding } from '../../audio/coinStreak'
import TokenFlights from './TokenFlights'
import WalletHud from './WalletHud'
import { inboundFlights, outboundFlights, type FlightSpark, type TokenFlight, type WalletDelta } from './walletFlights'

interface WalletLayerProps {
  wallet: number
  lifetimeEarned: number
  lastMint: TokenEvent | null
  lastSpend: TokenEvent | null
  lastDenied: DeniedEvent | null
}

interface FlightBook {
  flights: TokenFlight[]
  sparks: FlightSpark[]
  pending: number
}

const maxFlightsInAir = 30
const groundLift = 14
const deltaReasons = new Set<TokenEvent['reason']>(['steal', 'refund', 'migration'])
const emptyBook: FlightBook = { flights: [], sparks: [], pending: 0 }

function centerOf(element: Element | null, origin: DOMRect | undefined): Vec | null {
  if (!element || !origin) return null
  const rect = element.getBoundingClientRect()
  return { x: rect.left + rect.width / 2 - origin.left, y: rect.top + rect.height / 2 - origin.top }
}

function startOf(event: TokenEvent, origin: DOMRect): Vec {
  if (event.position) return { x: event.position.x, y: event.position.y - groundLift }
  return { x: origin.width / 2, y: origin.height * 0.45 }
}

function WalletLayer({ wallet, lifetimeEarned, lastMint, lastSpend, lastDenied }: WalletLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLSpanElement>(null)
  const seenRef = useRef({ mint: lastMint?.id ?? null, spend: lastSpend?.id ?? null, denied: lastDenied?.id ?? null })
  const [book, setBook] = useState<FlightBook>(emptyBook)
  const [deltas, setDeltas] = useState<WalletDelta[]>([])
  const [bumpSignal, setBumpSignal] = useState(0)
  const [shakeSignal, setShakeSignal] = useState(0)

  const measure = useCallback(() => {
    const origin = layerRef.current?.getBoundingClientRect()
    return { origin, target: centerOf(glyphRef.current, origin) }
  }, [])

  useEffect(() => {
    if (!lastMint || seenRef.current.mint === lastMint.id) return
    seenRef.current.mint = lastMint.id
    const { origin, target } = measure()
    const event = lastMint
    const delta = deltaReasons.has(event.reason) ? { id: event.id, amount: event.amount } : null
    const schedule = window.setTimeout(() => {
      if (delta) setDeltas((current) => [...current.slice(-4), delta])
      if (!origin || !target) {
        setBumpSignal((signal) => signal + 1)
        playCoinLanding()
        return
      }
      setBook((current) => {
        if (current.flights.length >= maxFlightsInAir) return current
        const flights = inboundFlights(event, startOf(event, origin), target)
        const sparks = event.reason === 'steal' && event.position ? [...current.sparks, { id: event.id, position: startOf(event, origin), rays: 6 }] : current.sparks
        return { flights: [...current.flights, ...flights], sparks, pending: current.pending + event.amount }
      })
    }, 0)
    return () => window.clearTimeout(schedule)
  }, [lastMint, measure])

  useEffect(() => {
    if (!lastSpend || seenRef.current.spend === lastSpend.id) return
    seenRef.current.spend = lastSpend.id
    const { origin, target } = measure()
    const event = lastSpend
    const schedule = window.setTimeout(() => {
      setDeltas((current) => [...current.slice(-4), { id: event.id, amount: -event.amount }])
      if (!origin || !target || !event.position) return
      const destination = { x: event.position.x, y: event.position.y - groundLift }
      setBook((current) => (current.flights.length >= maxFlightsInAir ? current : { ...current, flights: [...current.flights, ...outboundFlights(event, target, destination)] }))
    }, 0)
    return () => window.clearTimeout(schedule)
  }, [lastSpend, measure])

  useEffect(() => {
    if (!lastDenied || seenRef.current.denied === lastDenied.id) return
    seenRef.current.denied = lastDenied.id
    if (lastDenied.reason !== 'insufficientFunds') return
    const schedule = window.setTimeout(() => setShakeSignal((signal) => signal + 1), 0)
    return () => window.clearTimeout(schedule)
  }, [lastDenied])

  const handleArrive = useCallback((flight: TokenFlight) => {
    setBook((current) => {
      if (!current.flights.some((candidate) => candidate.id === flight.id)) return current
      return { ...current, flights: current.flights.filter((candidate) => candidate.id !== flight.id), pending: Math.max(0, current.pending - flight.share) }
    })
    if (flight.direction !== 'in') return
    setBumpSignal((signal) => signal + 1)
    playCoinLanding()
  }, [])

  const handleSparkDone = useCallback((sparkId: string) => {
    setBook((current) => ({ ...current, sparks: current.sparks.filter((spark) => spark.id !== sparkId) }))
  }, [])

  const handleDeltaDone = useCallback((deltaId: string) => {
    setDeltas((current) => current.filter((delta) => delta.id !== deltaId))
  }, [])

  const shownAmount = Math.max(0, Math.min(wallet, wallet - book.pending))

  return (
    <>
      <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 258000 }}>
        <TokenFlights flights={book.flights} sparks={book.sparks} onArrive={handleArrive} onSparkDone={handleSparkDone} />
      </div>
      <WalletHud
        shownAmount={shownAmount}
        wallet={wallet}
        lifetimeEarned={lifetimeEarned}
        bumpSignal={bumpSignal}
        shakeSignal={shakeSignal}
        deltas={deltas}
        glyphRef={glyphRef}
        onDeltaDone={handleDeltaDone}
      />
    </>
  )
}

export default memo(WalletLayer)
