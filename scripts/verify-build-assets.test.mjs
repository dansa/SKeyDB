import assert from 'node:assert/strict'
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {verifyBuildAssets} from './verify-build-assets.mjs'

async function createFixture(indexHtml, files = []) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skeydb-build-assets-'))
  await mkdir(path.join(root, 'assets'), {recursive: true})
  await writeFile(path.join(root, 'index.html'), indexHtml)
  await Promise.all(files.map((file) => writeFile(path.join(root, file), 'fixture')))
  return root
}

test('build asset verification accepts every local document reference in one output', async () => {
  const distDir = await createFixture(
    '<script type="module" src="/assets/index.js"></script><link rel="modulepreload" href="/assets/vendor.js"><link rel="stylesheet" href="/assets/index.css"><link rel="icon" href="/favicon.ico">',
    ['assets/index.js', 'assets/vendor.js', 'assets/index.css', 'favicon.ico'],
  )

  const result = await verifyBuildAssets({distDir})

  assert.deepEqual(result, [
    '/assets/index.js',
    '/assets/vendor.js',
    '/assets/index.css',
    '/favicon.ico',
  ])
})

test('build asset verification rejects a document reference missing from the same output', async () => {
  const distDir = await createFixture('<script type="module" src="/assets/missing.js"></script>')

  await assert.rejects(
    verifyBuildAssets({distDir}),
    /Document references missing build asset: \/assets\/missing\.js/,
  )
})

test('build asset verification strips a configured base path before resolving output files', async () => {
  const distDir = await createFixture(
    '<script type="module" src="/SKeyDB/assets/index.js?hash=secret#fragment"></script>',
    ['assets/index.js'],
  )

  const result = await verifyBuildAssets({basePath: '/SKeyDB/', distDir})

  assert.deepEqual(result, ['/SKeyDB/assets/index.js'])
})
