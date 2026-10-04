import { parseParkName } from '../../shared/parkName.ts'
import { findEconomyProblem, previousParkOf, readEconomyMark, type EconomyMark, type EconomyProblem, type PreviousPark } from '../../shared/parkEconomyCheck.ts'

export const MAX_PARK_BYTES = 512 * 1024

type ParkEnvelope =
  | { updatedAt: number; normalizedName: string; problem: EconomyProblem; mark: null; stamp: (receivedAt: number) => string }
  | { updatedAt: number; normalizedName: string; problem: null; mark: EconomyMark; stamp: (receivedAt: number) => string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseBody(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

export function readUpdatedAt(body: string): number {
  const parsed = parseBody(body)
  return isRecord(parsed) && typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : 0
}

export function readPreviousPark(body: string, now: number): PreviousPark | null {
  const parsed = parseBody(body)
  if (!isRecord(parsed)) return null
  return previousParkOf(parsed.sections, parsed.receivedAt, readUpdatedAt(body), now)
}

export function readParkEnvelope(body: string): ParkEnvelope | null {
  const parsed = parseBody(body)
  if (!isRecord(parsed) || typeof parsed.version !== 'number' || typeof parsed.updatedAt !== 'number') return null
  if (!Number.isFinite(parsed.updatedAt) || parsed.updatedAt <= 0) return null
  const owner = parsed.owner
  if (!isRecord(owner) || typeof owner.first !== 'string' || typeof owner.last !== 'string') return null
  const normalizedName = parseParkName(`${owner.first} ${owner.last}`)
  if (!normalizedName) return null
  const stamp = (receivedAt: number) => JSON.stringify({ ...parsed, receivedAt })
  const base = { updatedAt: parsed.updatedAt, normalizedName, stamp }
  const problem = findEconomyProblem(parsed.sections)
  const mark = readEconomyMark(parsed.sections)
  if (problem || !mark.ok) return { ...base, problem: problem ?? 'economy', mark: null }
  return { ...base, problem: null, mark: mark.value }
}
