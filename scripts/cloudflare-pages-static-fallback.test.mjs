import assert from 'node:assert/strict'
import {access, readFile} from 'node:fs/promises'
import test from 'node:test'

const assetNotFoundUrl = new URL('../public/assets/404.html', import.meta.url)
const redirectsUrl = new URL('../public/_redirects', import.meta.url)

test('static Pages asset fallback uses a nested 404 without a broad SPA rewrite', async () => {
  const assetNotFound = await readFile(assetNotFoundUrl, 'utf8')

  assert.match(assetNotFound, /<title>SKeyDB asset not found<\/title>/)
  assert.match(assetNotFound, /<h1>SKeyDB asset not found\.<\/h1>/)
  assert.doesNotMatch(assetNotFound, /<script\b/i)

  await assert.rejects(access(redirectsUrl), (error) => error?.code === 'ENOENT')
})
