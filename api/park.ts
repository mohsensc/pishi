import { handleParkRequest } from '../server/parkStore/handleParkRequest.ts'
import type { ParkStore } from '../server/parkStore/parkStoreTypes.ts'
import { selectParkStore } from '../server/parkStore/selectParkStore.ts'

let storePromise: Promise<ParkStore> | null = null

function openStore(): Promise<ParkStore> {
  storePromise ??= selectParkStore().catch((error: unknown) => {
    storePromise = null
    throw error
  })
  return storePromise
}

function respond(request: Request): Promise<Response> {
  return handleParkRequest(request, openStore)
}

export const GET = respond
export const PUT = respond
export const POST = respond
