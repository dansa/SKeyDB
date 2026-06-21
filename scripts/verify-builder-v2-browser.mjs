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
  await runActiveTeamAwakenerDndSmoke(page, viewportName)
  await runActiveTeamWheelDndSmoke(page, viewportName)
  await runTeamManagementDndSmoke(page, viewportName)

  console.log(`[${viewportName}] pointer DnD smoke completed.`)
}

async function runActiveTeamAwakenerDndSmoke(page, viewportName) {
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
  await dragBetweenElements(page, sourceElement, targetElement, {
    activeSelector: '.builder-v2-active-team .builder-v2-slot-card--drop-target',
    label: `${viewportName} picker awakener to active-team slot`,
    viewportName,
  })
  const after = await page.locator('.builder-v2-active-team').innerText()

  if (before === after) {
    throw new Error(`[${viewportName}] picker-to-slot DnD did not change the active team.`)
  }
}

async function runActiveTeamWheelDndSmoke(page, viewportName) {
  await selectPickerTab(page, 'Wheels')

  const source = page.locator('.builder-v2-picker-tile--wheel[data-owned="true"]').first()
  const target = page
    .locator(
      '.builder-v2-active-team .builder-v2-slot-card:not(.builder-v2-slot-card--empty) .builder-v2-wheel-target:not([disabled])',
    )
    .first()
  const sourceElement = await firstVisibleElement(source)
  const targetElement = await firstVisibleElement(target)

  if (!sourceElement || !targetElement) {
    throw new Error(
      `[${viewportName}] expected a visible picker wheel and active-team wheel target for DnD smoke.`,
    )
  }

  const before = await page.locator('.builder-v2-active-team').innerText()
  await dragBetweenElements(page, sourceElement, targetElement, {
    activeSelector: '.builder-v2-active-team .builder-v2-wheel-chip--drop-target',
    label: `${viewportName} picker wheel to active-team nested wheel`,
    viewportName,
  })
  const after = await page.locator('.builder-v2-active-team').innerText()

  if (before === after) {
    throw new Error(`[${viewportName}] picker-to-active-wheel DnD did not change the active team.`)
  }
}

async function runTeamManagementDndSmoke(page, viewportName) {
  await ensureSecondTeam(page)
  await selectPickerTab(page, 'Awakeners')

  const source = page.locator('.builder-v2-picker-tile--awakener:not([data-blocked="true"])')
  const target = page
    .locator(
      '.builder-v2-team-management-row:not(.builder-v2-team-management-row--active) .builder-v2-team-management-slot--empty',
    )
    .first()
  const sourceElement = await firstVisibleElement(source)
  const targetElement = await firstVisibleElement(target)

  if (!sourceElement || !targetElement) {
    throw new Error(
      `[${viewportName}] expected a picker awakener and inactive team-management empty slot for DnD smoke.`,
    )
  }

  const targetRow = targetElement.locator(
    'xpath=ancestor::*[contains(@class, "builder-v2-team-management-row")][1]',
  )
  const before = await targetRow.innerText()
  await dragBetweenElements(page, sourceElement, targetElement, {
    activeSelector:
      '.builder-v2-team-management-row:not(.builder-v2-team-management-row--active) .builder-v2-team-management-slot--drop-target',
    label: `${viewportName} picker awakener to team-management slot`,
    viewportName,
  })
  const after = await targetRow.innerText()

  if (before === after) {
    throw new Error(
      `[${viewportName}] picker-to-team-management-slot DnD did not change target team row.`,
    )
  }
}

async function selectPickerTab(page, tabName) {
  const tab = page.getByRole('tab', {name: tabName})
  await assertVisible(tab, `${tabName} picker tab`)
  await tab.click()
}

async function ensureSecondTeam(page) {
  const rows = page.locator('.builder-v2-team-management-row')
  if ((await rows.count()) > 1) {
    return
  }

  const addTeam = page.getByRole('button', {name: '+ Add Team'})
  await assertVisible(addTeam, 'add team button')
  await addTeam.click()
  await rows.nth(1).waitFor({state: 'visible', timeout: 10_000})
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

async function dragBetweenElements(page, source, target, options = {}) {
  const {activeSelector, label = 'DnD interaction', viewportName = 'viewport'} = options
  const sourceBox = await source.boundingBox()
  const targetBox = await target.boundingBox()
  if (!sourceBox || !targetBox) {
    throw new Error(
      `[${viewportName}] ${label} missing bounding boxes: ${JSON.stringify({
        source: sourceBox,
        target: targetBox,
      })}`,
    )
  }

  const sourceCenter = getCenter(sourceBox)
  const targetCenter = getCenter(targetBox)

  try {
    await page.mouse.move(sourceCenter.x, sourceCenter.y)
    await page.mouse.down()
    await page.mouse.move(
      (sourceCenter.x + targetCenter.x) / 2,
      (sourceCenter.y + targetCenter.y) / 2,
      {steps: 4},
    )
    await assertDragOverlayVisible(page, label)
    await page.mouse.move(targetCenter.x, targetCenter.y, {steps: 8})
    if (activeSelector) {
      await assertSelectorAppearsWhileHeld(page, activeSelector, label)
    }
    await page.mouse.up()
    await assertDragOverlayCleared(page, label)
  } catch (error) {
    await page.mouse.up().catch(() => {})
    const screenshotPath = `builder-v2-dnd-${viewportName}-${Date.now().toString()}.png`
    await page.screenshot({path: screenshotPath, fullPage: true}).catch(() => null)
    throw new Error(
      `[${viewportName}] ${label} failed. Screenshot: ${screenshotPath}. Boxes: ${JSON.stringify({
        source: sourceBox,
        target: targetBox,
      })}. ${error instanceof Error ? error.message : ''}`,
      {cause: error},
    )
  }
}

function getCenter(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }
}

async function assertSelectorAppearsWhileHeld(page, selector, label) {
  const locator = page.locator(selector).first()
  try {
    await locator.waitFor({state: 'visible', timeout: 2_000})
  } catch (error) {
    throw new Error(`Expected held-pointer drop target for ${label}: ${selector}.`, {
      cause: error,
    })
  }
}

async function assertDragOverlayVisible(page, label) {
  try {
    await page
      .locator('.builder-v2-drag-preview')
      .first()
      .waitFor({state: 'visible', timeout: 2_000})
  } catch (error) {
    throw new Error(`Expected drag overlay during ${label}.`, {cause: error})
  }
}

async function assertDragOverlayCleared(page, label) {
  try {
    await page.locator('.builder-v2-drag-preview').waitFor({state: 'detached', timeout: 2_000})
  } catch (error) {
    const visibleCount = await page.locator('.builder-v2-drag-preview:visible').count()
    if (visibleCount === 0) {
      return
    }
    throw new Error(`Expected drag overlay to clear after ${label}.`, {cause: error})
  }
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
