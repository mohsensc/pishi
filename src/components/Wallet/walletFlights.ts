import type { TokenEvent, Vec } from '../../game/types'

export type FlightDirection = 'in' | 'out'

export interface TokenFlight {
  id: string
  groupId: string
  direction: FlightDirection
  from: Vec
  to: Vec
  lift: number
  delay: number
  duration: number
  spin: number
  size: number
  share: number
}

export interface FlightSpark {
  id: string
  position: Vec
  rays: number
}

export interface WalletDelta {
  id: string
  amount: number
}

const maxGlyphsPerGroup = 6

export function glyphCountFor(event: TokenEvent): number {
  if (event.reason === 'steal') return 3
  if (event.reason === 'catch') return Math.min(maxGlyphsPerGroup, Math.max(1, event.amount))
  return Math.min(maxGlyphsPerGroup, Math.max(1, Math.ceil(event.amount / 10)))
}

function spread(index: number, count: number): number {
  return count <= 1 ? 0 : index / (count - 1) - 0.5
}

export function inboundFlights(event: TokenEvent, from: Vec, to: Vec): TokenFlight[] {
  const count = glyphCountFor(event)
  const base = Math.floor(event.amount / count)
  const remainder = event.amount - base * count
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  return Array.from({ length: count }, (_, index) => {
    const offset = spread(index, count)
    return {
      id: `${event.id}-${index}`,
      groupId: event.id,
      direction: 'in' as const,
      from: { x: from.x + offset * 26, y: from.y + Math.abs(offset) * 8 },
      to,
      lift: Math.min(160, 60 + distance * 0.18) * (1 + offset * 0.4),
      delay: index * 0.07,
      duration: Math.min(0.65, 0.45 + distance / 4200),
      spin: (index % 2 === 0 ? 1 : -1) * (300 + index * 40),
      size: event.reason === 'steal' ? 19 : 17,
      share: base + (index === count - 1 ? remainder : 0),
    }
  })
}

export function outboundFlights(event: TokenEvent, from: Vec, to: Vec): TokenFlight[] {
  const count = Math.min(4, Math.max(1, Math.ceil(event.amount / 60)))
  const distance = Math.hypot(to.x - from.x, to.y - from.y)
  return Array.from({ length: count }, (_, index) => ({
    id: `${event.id}-${index}`,
    groupId: event.id,
    direction: 'out' as const,
    from,
    to: { x: to.x + spread(index, count) * 22, y: to.y },
    lift: Math.min(120, 40 + distance * 0.14),
    delay: index * 0.06,
    duration: Math.min(0.6, 0.38 + distance / 4800),
    spin: index % 2 === 0 ? 240 : -240,
    size: 14,
    share: 0,
  }))
}
