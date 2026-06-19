import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'

import {chromium} from '@playwright/test'

/* global document, window */

const HOST = '127.0.0.1'
const PORTS = [5173, 5174, 5175, 5176, 5177]
const VIEWPORTS = [
  {name: 'desktop', width: 1365, height: 900, dnd: true},
  {name: 'adaptive', width: 900, height: 900, dnd: true},
  {name: 'mobile', width: 390, height: 844, dnd: false},
]

let serverProcess = null
let baseUrl = ''
let builderUrl = ''

async function main() {
  const port = await findAvailablePort()
  setBaseUrl(port)
  const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
  serverProcess = spawn(process.execPath, [viteBin, '--host', HOST, '--port', String(port)], {
    env: {...process.env, BROWSER: 'none'},
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  serverProcess.stdout.on('data', (chunk) => {
    process.stdout.write(`[vite] ${chunk}`)
  })
  serverProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[vite] ${chunk}`)
  })
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      process.stderr.write(`Vite dev server exited with code ${String(code)}.\n`)
    }
  })

  await waitForServer()

  const browser = await chromium.launch()
  try {
    for (const viewport of VIEWPORTS) {
      await runViewportSmoke(browser, viewport)
    }
  } finally {
    await browser.close()
    stopServer()
  }
}

async function runViewportSmoke(browser, viewport) {
  const page = await browser.newPage({viewport})
  const consoleMessages = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleMessages.push(message.text())
    }
  })

  try {
    await page.goto(builderUrl, {waitUntil: 'networkidle'})
    await assertVisible(page.locator('.builder-v2-page'), `${viewport.name} builder page`)
    await assertAttached(
      page.locator('#builder-v2-title', {hasText: 'Builder V2'}),
      `${viewport.name} heading`,
    )
    await assertNoHorizontalOverflow(page, viewport.name)
    await assertViewportSurfaces(page, viewport)
    await assertFocusableControl(page, viewport.name)

    if (viewport.dnd) {
      await runPointerDndSmoke(page, viewport.name)
    } else {
      console.log(
        `[${viewport.name}] pointer DnD skipped: mobile layout intentionally disables DnD.`,
      )
    }

    if (consoleMessages.length > 0) {
      throw new Error(`[${viewport.name}] browser console errors:\n${consoleMessages.join('\n')}`)
    }

    console.log(`[${viewport.name}] Builder V2 browser smoke passed.`)
  } finally {
    await page.close()
  }
}

async function assertViewportSurfaces(page, viewport) {
  if (viewport.name === 'desktop') {
    await assertVisible(
      page.getByRole('main', {name: 'Active builder workspace'}),
      'desktop workbench',
    )
    await assertVisible(page.locator('.builder-v2-active-team'), 'desktop active team')
    await assertVisible(
      page.getByRole('complementary', {name: 'Builder V2 armory'}),
      'desktop armory',
    )
    await assertVisible(page.locator('.builder-v2-team-management'), 'desktop teams')
    return
  }

  if (viewport.name === 'adaptive') {
    await assertVisible(
      page.getByRole('main', {name: 'Adaptive active team'}),
      'adaptive active team',
    )
    await assertVisible(page.locator('.builder-v2-active-team'), 'adaptive active builder')
    await assertVisible(page.locator('.builder-v2-adaptive-picker'), 'adaptive picker')
    await assertVisible(page.locator('.builder-v2-team-management'), 'adaptive teams')
    return
  }

  await assertVisible(
    page.getByRole('region', {name: 'Mobile team builder'}),
    'mobile team builder',
  )
  await assertVisible(page.locator('.builder-v2-mobile-active-team'), 'mobile active builder')
  await assertVisible(page.locator('.builder-v2-team-management'), 'mobile teams')

  const firstSlot = page.getByRole('button', {name: 'Select Slot 1'}).first()
  await assertVisible(firstSlot, 'mobile picker trigger')
  await firstSlot.click()
  await assertVisible(page.getByRole('dialog', {name: /Awakener/i}), 'mobile picker dialog')
  await page.keyboard.press('Escape')
}

async function assertFocusableControl(page, viewportName) {
  const control = page
    .locator(
      [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', '),
    )
    .first()

  await assertVisible(control, `${viewportName} focusable control`)
  const beforeFocusStyle = await control.evaluate(readFocusIndicatorStyle)
  await control.focus()

  const isActive = await control.evaluate((element) => document.activeElement === element)
  const focusStyle = await control.evaluate(readFocusIndicatorStyle)

  if (!isActive) {
    throw new Error(`[${viewportName}] expected a control to receive focus.`)
  }

  const hasMeasurableFocus = hasVisibleFocusIndicator(beforeFocusStyle, focusStyle)

  if (!hasMeasurableFocus) {
    throw new Error(`[${viewportName}] focused control had no visible or measurable focus state.`)
  }
}

function readFocusIndicatorStyle(element) {
  const style = window.getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    borderBottomColor: style.borderBottomColor,
    borderBottomWidth: Number.parseFloat(style.borderBottomWidth),
    borderLeftColor: style.borderLeftColor,
    borderLeftWidth: Number.parseFloat(style.borderLeftWidth),
    borderRightColor: style.borderRightColor,
    borderRightWidth: Number.parseFloat(style.borderRightWidth),
    borderTopColor: style.borderTopColor,
    borderTopWidth: Number.parseFloat(style.borderTopWidth),
    boxShadow: style.boxShadow,
    color: style.color,
    outlineColor: style.outlineColor,
    outlineOffset: style.outlineOffset,
    outlineStyle: style.outlineStyle,
    outlineWidth: Number.parseFloat(style.outlineWidth),
  }
}

function hasVisibleFocusIndicator(beforeFocusStyle, focusStyle) {
  if (hasVisibleOutline(focusStyle) || hasVisibleBoxShadow(focusStyle)) {
    return true
  }

  return (
    borderIndicatorChanged(beforeFocusStyle, focusStyle) ||
    focusStyle.backgroundColor !== beforeFocusStyle.backgroundColor ||
    focusStyle.color !== beforeFocusStyle.color
  )
}

function hasVisibleOutline(style) {
  return (
    style.outlineStyle !== 'none' &&
    style.outlineWidth > 0 &&
    style.outlineColor !== 'transparent' &&
    style.outlineColor !== 'rgba(0, 0, 0, 0)'
  )
}

function hasVisibleBoxShadow(style) {
  return style.boxShadow !== 'none' && !style.boxShadow.includes('rgba(0, 0, 0, 0)')
}

function borderIndicatorChanged(beforeFocusStyle, focusStyle) {
  return (
    borderSideChanged(beforeFocusStyle, focusStyle, 'Top') ||
    borderSideChanged(beforeFocusStyle, focusStyle, 'Right') ||
    borderSideChanged(beforeFocusStyle, focusStyle, 'Bottom') ||
    borderSideChanged(beforeFocusStyle, focusStyle, 'Left')
  )
}

function borderSideChanged(beforeFocusStyle, focusStyle, side) {
  return (
    focusStyle[`border${side}Width`] > 0 &&
    (focusStyle[`border${side}Color`] !== beforeFocusStyle[`border${side}Color`] ||
      focusStyle[`border${side}Width`] !== beforeFocusStyle[`border${side}Width`])
  )
}

async function runPointerDndSmoke(page, viewportName) {
  await preparePointerDndSmoke(page, viewportName)

  const source = page.locator('.builder-v2-picker-tile--awakener:not([data-blocked="true"])')
  const target = page
    .locator(
      '.builder-v2-active-team .builder-v2-slot-card--empty .builder-v2-awakener-art-target:not([disabled])',
    )
    .first()
  const sourceElement = await firstVisibleElement(source)
  const targetElement = await firstVisibleElement(target)

  if (!sourceElement || !targetElement) {
    throw new Error(
      `[${viewportName}] expected a visible picker awakener and empty active-team slot target for DnD smoke.`,
    )
  }

  const before = await page.locator('.builder-v2-active-team').innerText()
  await dragBetweenElements(page, sourceElement, targetElement)
  const after = await page.locator('.builder-v2-active-team').innerText()

  if (before === after) {
    throw new Error(`[${viewportName}] picker-to-slot DnD did not change the active team.`)
  }

  console.log(`[${viewportName}] pointer DnD smoke completed.`)
}

async function preparePointerDndSmoke(page, viewportName) {
  if (viewportName !== 'adaptive') {
    return
  }

  const visibleTile = await firstVisibleElement(
    page.locator('.builder-v2-picker-tile--awakener:not([data-blocked="true"])'),
  )
  if (visibleTile) {
    return
  }

  const expandPicker = page.getByRole('button', {name: 'Expand adaptive picker'})
  if ((await expandPicker.count()) > 0 && (await expandPicker.first().isVisible())) {
    await expandPicker.first().click()
    await assertVisible(
      page.locator('.builder-v2-picker-tile--awakener:not([data-blocked="true"])').first(),
      'adaptive picker DnD source',
    )
  }
}

async function firstVisibleElement(locator) {
  const count = await locator.count()
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index)
    if (await candidate.isVisible()) {
      return candidate
    }
  }
  return null
}

async function dragBetweenElements(page, source, target) {
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) return

  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, {
    steps: 8,
  })
  await page.mouse.up()
}

async function assertNoHorizontalOverflow(page, viewportName) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement
    return {
      clientWidth: documentElement.clientWidth,
      scrollWidth: documentElement.scrollWidth,
    }
  })

  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `[${viewportName}] document has horizontal overflow: scrollWidth ${String(
        overflow.scrollWidth,
      )}, clientWidth ${String(overflow.clientWidth)}.`,
    )
  }
}

async function assertVisible(locator, label) {
  try {
    await locator.waitFor({state: 'visible', timeout: 10_000})
  } catch (error) {
    throw new Error(`Expected visible ${label}. ${error instanceof Error ? error.message : ''}`, {
      cause: error,
    })
  }
}

async function assertAttached(locator, label) {
  try {
    await locator.waitFor({state: 'attached', timeout: 10_000})
  } catch (error) {
    throw new Error(`Expected attached ${label}. ${error instanceof Error ? error.message : ''}`, {
      cause: error,
    })
  }
}

function setBaseUrl(port) {
  baseUrl = `http://${HOST}:${String(port)}`
  builderUrl = `${baseUrl}/builder-v2`
}

async function findAvailablePort() {
  for (const port of PORTS) {
    const candidateBaseUrl = `http://${HOST}:${String(port)}`
    if (!(await isServerReachable(candidateBaseUrl))) {
      return port
    }
  }
  throw new Error(`No available Vite port found in ${PORTS.join(', ')}.`)
}

async function isThisAppServer(candidateBaseUrl) {
  try {
    const response = await fetch(candidateBaseUrl)
    if (!response.ok) return false
    const html = await response.text()
    return html.includes('<title>SKeyDB</title>')
  } catch {
    return false
  }
}

async function isServerReachable(candidateBaseUrl = baseUrl) {
  try {
    await fetch(candidateBaseUrl)
    return true
  } catch {
    return false
  }
}

async function waitForServer() {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30_000) {
    if (await isThisAppServer(baseUrl)) {
      return
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 500)
    })
  }
  throw new Error(`Timed out waiting for Vite dev server at ${baseUrl}.`)
}

process.on('exit', () => {
  stopServer()
})

main().catch((error) => {
  stopServer()
  console.error(error)
  process.exitCode = 1
})

function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return
  }
  serverProcess.kill()
  serverProcess = null
}
