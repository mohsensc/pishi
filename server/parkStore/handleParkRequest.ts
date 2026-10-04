import { parseParkName } from '../../shared/parkName.ts'
import { findHistoryProblem } from '../../shared/parkEconomyCheck.ts'
import { MAX_PARK_BYTES, readParkEnvelope, readPreviousPark } from './parkBody.ts'
import { parkKeyOf } from './parkKey.ts'
import type { ParkStore } from './parkStoreTypes.ts'

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }

function reply(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders })
}

async function readCappedBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_PARK_BYTES) return null
  const body = await request.text()
  return new TextEncoder().encode(body).length > MAX_PARK_BYTES ? null : body
}

async function readPark(store: ParkStore, key: string): Promise<Response> {
  const park = await store.read(key)
  if (!park) return reply(404, { park: null })
  return new Response(park.body, { status: 200, headers: jsonHeaders })
}

async function previousPark(store: ParkStore, key: string, now: number) {
  const stored = await store.read(key)
  return stored ? readPreviousPark(stored.body, now) : null
}

async function writePark(store: ParkStore, key: string, normalizedName: string, request: Request, now: number): Promise<Response> {
  const body = await readCappedBody(request)
  if (body === null) return reply(413, { error: 'park too large' })
  const envelope = readParkEnvelope(body)
  if (!envelope) return reply(400, { error: 'malformed park' })
  if (envelope.normalizedName !== normalizedName) return reply(400, { error: 'owner mismatch' })
  if (envelope.problem !== null) return reply(422, { error: 'implausible park', problem: envelope.problem })
  const historyProblem = findHistoryProblem(await previousPark(store, key, now), envelope.mark, envelope.updatedAt, now)
  if (historyProblem) return reply(422, { error: 'implausible park', problem: historyProblem })
  const stamped = envelope.stamp(now)
  if (new TextEncoder().encode(stamped).length > MAX_PARK_BYTES) return reply(413, { error: 'park too large' })
  const result = await store.write(key, { body: stamped, updatedAt: envelope.updatedAt })
  return reply(result.status === 'saved' ? 200 : 409, result)
}

export async function handleParkRequest(request: Request, openStore: () => Promise<ParkStore>, now = Date.now()): Promise<Response> {
  const normalizedName = parseParkName(new URL(request.url).searchParams.get('name'))
  if (!normalizedName) return reply(400, { error: 'invalid name' })
  const key = parkKeyOf(normalizedName)
  try {
    const store = await openStore()
    if (request.method === 'GET') return await readPark(store, key)
    if (request.method === 'PUT' || request.method === 'POST') return await writePark(store, key, normalizedName, request, now)
    return new Response(null, { status: 405, headers: { allow: 'GET, PUT, POST' } })
  } catch (error) {
    console.error('park request failed', error)
    return reply(503, { error: 'storage unavailable' })
  }
}
