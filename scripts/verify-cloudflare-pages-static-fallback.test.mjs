import assert from 'node:assert/strict'
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {verifyCloudflarePagesStaticFallback} from './verify-cloudflare-pages-static-fallback.mjs'

async function createFixture({
  assetNotFound = true,
  topLevelNotFound = false,
  redirects = false,
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skeydb-pages-static-fallback-'))
  if (assetNotFound) {
    await mkdir(path.join(root, 'assets'), {recursive: true})
    await writeFile(
      path.join(root, 'assets', '404.html'),
      '<!doctype html><title>SKeyDB asset not found</title><h1>SKeyDB asset not found.</h1>',
    )
  }
  if (topLevelNotFound) await writeFile(path.join(root, '404.html'), 'fallback')
  if (redirects) await writeFile(path.join(root, '_redirects'), '/* /index.html 200')
  return root
}

test('static Pages verifier accepts the nested asset fallback contract', async () => {
  const distDir = await createFixture()

  await verifyCloudflarePagesStaticFallback({distDir})
})

test('static Pages verifier rejects a missing nested asset fallback', async () => {
  const distDir = await createFixture({assetNotFound: false})

  await assert.rejects(
    verifyCloudflarePagesStaticFallback({distDir}),
    /Built asset fallback is missing/,
  )
})

test('static Pages verifier rejects a top-level 404 or broad redirect rule', async () => {
  const topLevelNotFoundDist = await createFixture({topLevelNotFound: true})
  await assert.rejects(
    verifyCloudflarePagesStaticFallback({distDir: topLevelNotFoundDist}),
    /top-level 404 disables Pages SPA fallback/,
  )

  const redirectsDist = await createFixture({redirects: true})
  await assert.rejects(
    verifyCloudflarePagesStaticFallback({distDir: redirectsDist}),
    /broad _redirects rule can rewrite missing assets/,
  )
})
