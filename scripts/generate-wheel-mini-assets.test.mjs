import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {fileURLToPath} from 'node:url'

import sharp from 'sharp'

import {
  collectWheelMiniAssetCoverage,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_EFFORT,
  DEFAULT_QUALITY,
  DEFAULT_RENDER_WIDTH,
  fullWheelNameToMiniName,
  MINI_MANIFEST_FILE_NAME,
  parseArgs,
  validateWheelMiniAssets,
} from './generate-wheel-mini-assets.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wheelsDir = path.join(repoRoot, 'src', 'assets', 'wheels')
const miniDir = path.join(wheelsDir, 'Mini')

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

test('parseArgs defaults to the square wheel mini recipe', () => {
  const options = parseArgs([])

  assert.equal(options.canvasSize, DEFAULT_CANVAS_SIZE)
  assert.equal(options.renderWidth, DEFAULT_RENDER_WIDTH)
  assert.equal(options.quality, DEFAULT_QUALITY)
  assert.equal(options.sharpen, true)
})

test('fullWheelNameToMiniName maps full wheel art to mini art names', () => {
  assert.equal(fullWheelNameToMiniName('Weapon_Full_SR19.webp'), 'Weapon_Mini_SR19.webp')
})

test('wheel mini assets cover every full wheel asset', async () => {
  const coverage = await collectWheelMiniAssetCoverage({wheelsDir, miniDir})

  assert.ok(coverage.fullWheelNames.length > 0)
  assert.deepEqual(coverage.missingMiniNames, [])
  assert.deepEqual(coverage.extraMiniNames, [])
})

test('wheel mini assets validate as committed square webp thumbnails', async () => {
  const validation = await validateWheelMiniAssets({wheelsDir, miniDir})

  assert.deepEqual(validation.invalidMiniItems, [])

  for (const miniWheelName of validation.coverage.miniWheelNames) {
    const metadata = await sharp(path.join(miniDir, miniWheelName)).metadata()

    assert.equal(metadata.width, DEFAULT_CANVAS_SIZE, miniWheelName)
    assert.equal(metadata.height, DEFAULT_CANVAS_SIZE, miniWheelName)
  }
})

test('wheel mini validation catches stale manifest hashes without regenerating assets', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wheel-mini-assets-'))
  const tempWheelsDir = path.join(tempDir, 'wheels')
  const tempMiniDir = path.join(tempWheelsDir, 'Mini')
  await fs.mkdir(tempMiniDir, {recursive: true})

  const fullWheelName = 'Weapon_Full_TEST.webp'
  const miniWheelName = 'Weapon_Mini_TEST.webp'
  const fullBuffer = await sharp({
    create: {
      width: 96,
      height: 96,
      channels: 4,
      background: {r: 255, g: 255, b: 255, alpha: 1},
    },
  })
    .webp()
    .toBuffer()
  const miniBuffer = await sharp({
    create: {
      width: DEFAULT_CANVAS_SIZE,
      height: DEFAULT_CANVAS_SIZE,
      channels: 4,
      background: {r: 0, g: 0, b: 0, alpha: 1},
    },
  })
    .webp()
    .toBuffer()

  await fs.writeFile(path.join(tempWheelsDir, fullWheelName), fullBuffer)
  await fs.writeFile(path.join(tempMiniDir, miniWheelName), miniBuffer)
  await fs.writeFile(
    path.join(tempMiniDir, MINI_MANIFEST_FILE_NAME),
    `${JSON.stringify({
      schemaVersion: 1,
      generator: {
        canvasSize: DEFAULT_CANVAS_SIZE,
        renderWidth: DEFAULT_RENDER_WIDTH,
        quality: DEFAULT_QUALITY,
        effort: DEFAULT_EFFORT,
        sharpen: true,
      },
      assets: [
        {
          full: fullWheelName,
          fullSha256: 'stale-full-hash',
          mini: miniWheelName,
          miniSha256: sha256(miniBuffer),
        },
      ],
    })}\n`,
  )

  const validation = await validateWheelMiniAssets({
    wheelsDir: tempWheelsDir,
    miniDir: tempMiniDir,
  })

  assert.deepEqual(validation.staleManifestItems, [
    {
      miniWheelName,
      fullWheelName,
      fullChanged: true,
      miniChanged: false,
    },
  ])
})
