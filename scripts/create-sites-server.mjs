import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const serverDir = join(process.cwd(), 'dist', 'server')
const serverFile = join(serverDir, 'index.js')

const worker = `const INDEX_PATH = '/index.html'

function withCacheHeaders(response) {
  const headers = new Headers(response.headers)
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable')
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const assetResponse = await env.ASSETS.fetch(request)

    if (assetResponse.status !== 404) {
      return withCacheHeaders(assetResponse)
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return assetResponse
    }

    const indexRequest = new Request(new URL(INDEX_PATH, url), request)
    const indexResponse = await env.ASSETS.fetch(indexRequest)

    if (indexResponse.status === 404) {
      return assetResponse
    }

    const headers = new Headers(indexResponse.headers)
    headers.set('cache-control', 'no-cache')
    return new Response(indexResponse.body, {
      status: 200,
      headers,
    })
  },
}
`

await mkdir(serverDir, { recursive: true })
await writeFile(serverFile, worker)
