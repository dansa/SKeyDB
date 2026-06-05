import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  applyWebpConversionPlan,
  createWebpConversionPlan,
  parseArgs,
  rewriteConvertedPngReferences,
} from './convert-png-assets-to-webp.mjs'

async function writeFixture(rootDir, relativePath, size) {
  const filePath = path.join(rootDir, relativePath)
  await fs.mkdir(path.dirname(filePath), {recursive: true})
  await fs.writeFile(filePath, Buffer.alloc(size, 1))
  return filePath
}

test('parseArgs defaults to Photoshop-like lossy webp settings', () => {
  const options = parseArgs(['--dry-run'])

  assert.equal(options.dryRun, true)
  assert.equal(options.quality, 90)
  assert.equal(options.effort, 6)
  assert.equal(options.lossyMinBytes, 64 * 1024)
  assert.equal(options.minSavingsRatio, 0)
})

test('parseArgs accepts a lossy conversion size gate in KiB', () => {
  const options = parseArgs(['--lossy-min-kib', '32'])

  assert.equal(options.lossyMinBytes, 32 * 1024)
})

test('createWebpConversionPlan uses lossless webp for pngs below the lossy size gate', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-mode-'))
  const assetsDir = path.join(tmpDir, 'assets')
  const smallPng = await writeFixture(assetsDir, 'icons/small.png', 100)
  const largePng = await writeFixture(assetsDir, 'cards/large.png', 200)
  const modesByFile = new Map()

  await createWebpConversionPlan({
    assetsDir,
    lossyMinBytes: 150,
    encodeWebp: async (_input, pngPath, webpOptions) => {
      modesByFile.set(pngPath, webpOptions.lossless ? 'lossless' : 'lossy')
      return Buffer.alloc(80, 2)
    },
  })

  assert.equal(modesByFile.get(smallPng), 'lossless')
  assert.equal(modesByFile.get(largePng), 'lossy')
})

test('createWebpConversionPlan allows small lossless conversions even when webp is larger', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-lossless-'))
  const assetsDir = path.join(tmpDir, 'assets')
  await writeFixture(assetsDir, 'icons/tiny.png', 100)

  const plan = await createWebpConversionPlan({
    assetsDir,
    lossyMinBytes: 150,
    encodeWebp: async () => Buffer.alloc(120, 2),
  })

  assert.equal(plan.convertCount, 1)
  assert.equal(plan.skipCount, 0)
  assert.equal(plan.folders[0].status, 'convert')
  assert.deepEqual(plan.folders[0].blockers, [])
  assert.equal(plan.folders[0].conversions[0].mode, 'lossless')
})

test('createWebpConversionPlan skips an entire folder when any png is not smaller', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-plan-'))
  const assetsDir = path.join(tmpDir, 'assets')
  await writeFixture(assetsDir, 'icons/smaller.png', 100)
  await writeFixture(assetsDir, 'icons/larger.png', 100)

  const plan = await createWebpConversionPlan({
    assetsDir,
    lossyMinBytes: 0,
    encodeWebp: async (_input, pngPath) => {
      return Buffer.alloc(pngPath.endsWith('smaller.png') ? 80 : 120, 2)
    },
  })

  assert.equal(plan.pngCount, 2)
  assert.equal(plan.convertCount, 0)
  assert.equal(plan.skipCount, 2)
  assert.equal(plan.folders[0].status, 'skip')
  assert.deepEqual(
    plan.folders[0].blockers.map((blocker) => path.basename(blocker.pngPath)),
    ['larger.png'],
  )
})

test('applyWebpConversionPlan replaces pngs only for convertible folders', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-apply-'))
  const assetsDir = path.join(tmpDir, 'assets')
  const convertPng = await writeFixture(assetsDir, 'convert/a.png', 100)
  const skipPng = await writeFixture(assetsDir, 'skip/b.png', 100)

  const plan = await createWebpConversionPlan({
    assetsDir,
    lossyMinBytes: 0,
    encodeWebp: async (_input, pngPath) => {
      return Buffer.alloc(pngPath === convertPng ? 80 : 120, 2)
    },
  })

  const converted = await applyWebpConversionPlan(plan)

  assert.deepEqual(converted, [
    {
      from: convertPng,
      to: convertPng.replace(/\.png$/i, '.webp'),
    },
  ])
  await assert.rejects(fs.access(convertPng))
  assert.equal((await fs.readFile(convertPng.replace(/\.png$/i, '.webp'))).byteLength, 80)
  assert.equal((await fs.readFile(skipPng)).byteLength, 100)
})

test('rewriteConvertedPngReferences updates exact imports and folder globs', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'momentb-webp-rewrite-'))
  const assetsDir = path.join(tmpDir, 'src', 'assets')
  const sourcePath = path.join(tmpDir, 'src', 'domain', 'icons.ts')
  const from = path.join(assetsDir, 'icons', 'Battle_Card_Buff_001.png')
  const to = path.join(assetsDir, 'icons', 'Battle_Card_Buff_001.webp')

  await fs.mkdir(path.dirname(sourcePath), {recursive: true})
  await fs.writeFile(
    sourcePath,
    [
      "import icon from '@" + "/assets/icons/Battle_Card_Buff_001.png'",
      "const icons = import.meta.glob<string>('../assets/icons/*.webp')",
      '',
    ].join('\n'),
    'utf8',
  )

  const changed = await rewriteConvertedPngReferences({
    rootDir: tmpDir,
    assetsDir,
    converted: [{from, to}],
  })

  assert.deepEqual(changed, [sourcePath])
  assert.equal(
    await fs.readFile(sourcePath, 'utf8'),
    [
      "import icon from '@/assets/icons/Battle_Card_Buff_001.webp'",
      "const icons = import.meta.glob<string>('../assets/icons/*.webp')",
      '',
    ].join('\n'),
  )
})
