import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const headersUrl = new URL('../public/_headers', import.meta.url)

test('Cloudflare Pages does not cache SPA fallback responses as immutable assets', async () => {
  const headers = await readFile(headersUrl, 'utf8')

  assert.doesNotMatch(
    headers,
    /^\s*Cache-Control:.*\bimmutable\b/im,
    'Pages SPA fallback responses can inherit matching _headers rules, so immutable caching can permanently store HTML under missing asset URLs.',
  )
})
