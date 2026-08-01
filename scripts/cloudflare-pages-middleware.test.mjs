import assert from 'node:assert/strict'
import test from 'node:test'

import {onRequest} from '../functions/_middleware.js'

function createContext(pathname, assetResponse) {
  return {
    env: {
      ASSETS: {
        fetch: async () => assetResponse,
      },
    },
    next: async () =>
      new Response('<!doctype html>', {
        headers: {'content-type': 'text/html; charset=utf-8'},
        status: 200,
      }),
    request: new Request(`https://skeydb.com${pathname}`),
  }
}

test('Pages middleware leaves document routes to the SPA fallback', async () => {
  const response = await onRequest(createContext('/database', new Response('unused')))

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8')
})

test('Pages middleware converts an HTML asset fallback into a non-cacheable 404', async () => {
  const response = await onRequest(
    createContext(
      '/assets/missing-module.js',
      new Response('<!doctype html>', {
        headers: {'content-type': 'text/html; charset=utf-8'},
        status: 200,
      }),
    ),
  )

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(await response.text(), 'SKeyDB asset not found.')
})

test('Pages middleware converts an HTML 304 fallback into a body-safe 404', async () => {
  const response = await onRequest(
    createContext(
      '/assets/revalidated-module.js',
      new Response(null, {
        headers: {'content-type': 'text/html; charset=utf-8'},
        status: 304,
      }),
    ),
  )

  assert.equal(response.status, 404)
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(await response.text(), 'SKeyDB asset not found.')
})

test('Pages middleware preserves an upstream HTML error status', async () => {
  const response = await onRequest(
    createContext(
      '/assets/unavailable-module.js',
      new Response('<!doctype html><h1>Service unavailable</h1>', {
        headers: {'content-type': 'text/html; charset=utf-8'},
        status: 503,
      }),
    ),
  )

  assert.equal(response.status, 503)
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(await response.text(), 'SKeyDB asset service error.')
})

test('Pages middleware preserves a valid JavaScript asset response', async () => {
  const response = await onRequest(
    createContext(
      '/assets/main.js',
      new Response('export {}', {
        headers: {'content-type': 'application/javascript'},
        status: 200,
      }),
    ),
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'application/javascript')
  assert.equal(await response.text(), 'export {}')
})
