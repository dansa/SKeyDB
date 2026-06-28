import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import {fileURLToPath} from 'node:url'

import sharp from 'sharp'

import {
  collectWheelMiniAssetCoverage,
  DEFAULT_CANVAS_SIZE,
  DEFAULT_QUALITY,
  DEFAULT_RENDER_WIDTH,
  fullWheelNameToMiniName,
  parseArgs,
} from './generate-wheel-mini-assets.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wheelsDir = path.join(repoRoot, 'src', 'assets', 'wheels')
const miniDir = path.join(wheelsDir, 'Mini')

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

test('wheel mini assets are square generated thumbnails', async () => {
  const coverage = await collectWheelMiniAssetCoverage({wheelsDir, miniDir})

  await Promise.all(
    coverage.miniWheelNames.map(async (miniWheelName) => {
      const metadata = await sharp(path.join(miniDir, miniWheelName)).metadata()

      assert.equal(metadata.width, DEFAULT_CANVAS_SIZE, miniWheelName)
      assert.equal(metadata.height, DEFAULT_CANVAS_SIZE, miniWheelName)
    }),
  )
})
