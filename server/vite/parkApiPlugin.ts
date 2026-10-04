import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'
import { handleParkRequest } from '../parkStore/handleParkRequest.ts'
import type { ParkStore } from '../parkStore/parkStoreTypes.ts'
import { selectParkStore } from '../parkStore/selectParkStore.ts'

const parkRoute = '/api/park'

async function readNodeBody(request: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

async function toWebRequest(request: Connect.IncomingMessage): Promise<Request> {
  const url = new URL(request.originalUrl ?? request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  const headers = new Headers()
  Object.entries(request.headers).forEach(([name, value]) => {
    if (typeof value === 'string') headers.set(name, value)
    else if (Array.isArray(value)) headers.set(name, value.join(', '))
  })
  const method = request.method ?? 'GET'
  const body = method === 'GET' || method === 'HEAD' ? undefined : new Uint8Array(await readNodeBody(request))
  return new Request(url, { method, headers, body })
}

async function sendWebResponse(response: Response, target: ServerResponse): Promise<void> {
  target.statusCode = response.status
  response.headers.forEach((value, name) => target.setHeader(name, value))
  target.end(Buffer.from(await response.arrayBuffer()))
}

function createParkMiddleware(root: string): Connect.NextHandleFunction {
  let storePromise: Promise<ParkStore> | null = null
  const openStore = () => (storePromise ??= selectParkStore(process.env, root))
  return (request, response, next) => {
    toWebRequest(request)
      .then((webRequest) => handleParkRequest(webRequest, openStore))
      .then((webResponse) => sendWebResponse(webResponse, response))
      .catch(next)
  }
}

export function parkApiPlugin(): Plugin {
  return {
    name: 'park-api',
    configureServer(server) {
      server.middlewares.use(parkRoute, createParkMiddleware(server.config.root))
    },
    configurePreviewServer(server) {
      server.middlewares.use(parkRoute, createParkMiddleware(server.config.root))
    },
  }
}
