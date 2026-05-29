import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'
import {decodeImportCode, encodeMultiTeamCode, encodeSingleTeamCode} from '@/domain/import-export'
import {clearDatabaseDetailRecordCacheForTests} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {builderDraftStore} from '@/stores/builderDraftStore'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {saveBuilderDraft} from '../builder/builder-persistence'
import {createEmptyTeamSlots} from '../builder/constants'
import type {Team} from '../builder/types'
import {BuilderV2Page} from './BuilderV2Page'

function resizeBuilderV2Viewport(width: number, dispatchResize = true) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  if (dispatchResize) {
    window.dispatchEvent(new Event('resize'))
  }
}

const awakenerIdByName = new Map([
  ['goliath', 'awakener-0021'],
  ['ramona', 'awakener-0042'],
])

function makeImportTeam(name: string, awakenerName: string, posseId?: string): Team {
  const awakenerId = awakenerIdByName.get(awakenerName)
  if (!awakenerId) {
    throw new Error(`Unknown test awakener ${awakenerName}`)
  }
  return {
    id: `${name}-id`,
    name,
    posseId,
    slots: [
      {slotId: 'slot-1', awakenerId, realm: 'CHAOS', level: 60, wheels: [null, null]},
      {slotId: 'slot-2', wheels: [null, null]},
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ],
  }
}

function getRequiredTextArea(element: HTMLElement): HTMLTextAreaElement {
  if (!(element instanceof HTMLTextAreaElement)) {
    throw new Error('Expected textarea')
  }
  return element
}

const originalMatchMedia = window.matchMedia

beforeEach(() => {
  clearDatabaseDetailRecordCacheForTests()
  dbDetailStore.getState().closeAllDetails()
})

function mockBuilderV2TouchDevice(isTouchType: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches:
          isTouchType &&
          (query.includes('any-pointer: coarse') ||
            query.includes('pointer: coarse') ||
            query.includes('hover: none')),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => true,
      }) as MediaQueryList,
  })
}

afterEach(() => {
  act(() => {
    dbDetailStore.getState().closeAllDetails()
  })
  cleanup()
  resizeBuilderV2Viewport(1200, false)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })
})

describe('BuilderV2Page', () => {
  it('renders a concept-informed shell with four slots and an awakener picker', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    expect(screen.getByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /my teams/i})).toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /builder v2 armory/i})).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
    expect(screen.getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
  })

  it('keeps picker tab ids instance-safe and exposes tile status in accessible names', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const awakenerTab = screen.getByRole('tab', {name: /^awakeners$/i})
    const awakenerPanelId = awakenerTab.getAttribute('aria-controls')
    expect(awakenerPanelId).toBeTruthy()
    expect(document.getElementById(awakenerPanelId ?? '')).toHaveAttribute(
      'aria-labelledby',
      awakenerTab.id,
    )

    fireEvent.keyDown(awakenerTab, {key: 'ArrowRight'})

    const wheelTab = screen.getByRole('tab', {name: /^wheels$/i})
    expect(wheelTab).toHaveFocus()
    expect(document.getElementById(wheelTab.getAttribute('aria-controls') ?? '')).toHaveAttribute(
      'aria-labelledby',
      wheelTab.id,
    )

    const pickerIds = Array.from(
      document.querySelectorAll<HTMLElement>('.builder-v2-armory [id]'),
    ).map((element) => element.id)
    expect(pickerIds).toEqual([
      expect.stringMatching(/^builder-v2-picker-.+-tab-awakeners$/),
      expect.stringMatching(/^builder-v2-picker-.+-tab-wheels$/),
      expect.stringMatching(/^builder-v2-picker-.+-tab-covenants$/),
      expect.stringMatching(/^builder-v2-picker-.+-tab-posses$/),
      expect.stringMatching(/^builder-v2-picker-.+-panel$/),
    ])
    expect(new Set(pickerIds).size).toBe(pickerIds.length)

    fireEvent.click(screen.getByRole('tab', {name: /^awakeners$/i}))

    expect(screen.getByRole('button', {name: /goliath, level \d+/i})).toBeInTheDocument()
  })

  it('opens database details from V2 picker tile actions without assigning the item', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByTitle('View Goliath details'))
    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'awakener',
      id: 'awakener-0021',
      source: 'builder-overlay',
    })
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    act(() => {
      dbDetailStore.getState().closeAllDetails()
    })

    fireEvent.click(screen.getByRole('tab', {name: /^wheels$/i}))
    fireEvent.click(screen.getByTitle('View Merciful Nurturing details'))
    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'wheel',
      id: 'wheel-0050',
      source: 'builder-overlay',
    })
    act(() => {
      dbDetailStore.getState().closeAllDetails()
    })

    fireEvent.click(screen.getByRole('tab', {name: /^covenants$/i}))
    fireEvent.click(screen.getByTitle('View Deus Ex Machina details'))
    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'covenant',
      id: 'c01',
      source: 'builder-overlay',
    })
    act(() => {
      dbDetailStore.getState().closeAllDetails()
    })

    fireEvent.click(screen.getByRole('tab', {name: /^posses$/i}))
    fireEvent.click(screen.getByTitle('View Taverns Opening details'))
    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'posse',
      id: 'posse-0033',
      source: 'builder-overlay',
    })
  })

  it('shows the picker clear card on every tab for the active target', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    fireEvent.click(screen.getByRole('tab', {name: /^posses$/i}))

    const clearSlot = screen.getByRole('button', {name: /^clear slot 1$/i})
    expect(clearSlot).toHaveTextContent(/clear slot/i)

    fireEvent.click(clearSlot)

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
  })

  it('renders a functional desktop team management overview and switches teams from it', () => {
    const teamOneSlots = createEmptyTeamSlots()
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 90,
      isSupport: true,
      wheels: ['wheel-0050', null],
      covenantId: 'c01',
    }
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots, posseId: 'posse-0033'},
        ],
      })
    })

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    expect(within(management).getByRole('button', {name: /add team/i})).toBeInTheDocument()
    expect(within(management).getByRole('button', {name: /apply d-tide 5/i})).toBeInTheDocument()
    expect(within(management).getByRole('button', {name: /compact/i})).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    fireEvent.click(within(management).getByRole('button', {name: /expanded/i}))
    expect(within(management).getByRole('button', {name: /expanded/i})).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(within(management).getByText(/taverns opening/i)).toBeInTheDocument()
    expect(within(management).getByText(/support/i)).toBeInTheDocument()
    expect(
      within(management).getByRole('group', {
        name: /goliath, chaos, level 90, support, covenant equipped: .+, 1 wheel equipped: .+/i,
      }),
    ).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /select team 2/i}))

    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
  })

  it('renames teams from the V2 management surface with Enter, Escape, blur, and blank no-op', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(management).getByRole('button', {name: /rename team 1/i}))
    const renameInput = within(management).getByRole('textbox', {name: /team name/i})
    fireEvent.change(renameInput, {target: {value: 'Arena Team'}})
    fireEvent.keyDown(renameInput, {key: 'Enter', code: 'Enter'})

    expect(within(management).getByRole('button', {name: /select arena team/i})).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /rename arena team/i}))
    const cancelInput = within(management).getByRole('textbox', {name: /team name/i})
    fireEvent.change(cancelInput, {target: {value: 'Temp Team'}})
    fireEvent.keyDown(cancelInput, {key: 'Escape', code: 'Escape'})

    expect(within(management).queryByText(/temp team/i)).not.toBeInTheDocument()
    expect(within(management).getByRole('button', {name: /select arena team/i})).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /rename arena team/i}))
    const blankInput = within(management).getByRole('textbox', {name: /team name/i})
    fireEvent.change(blankInput, {target: {value: '   '}})
    fireEvent.blur(blankInput)

    expect(within(management).getByRole('button', {name: /select arena team/i})).toBeInTheDocument()
  })

  it('confirms destructive team actions and applies templates from the V2 management surface', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    fireEvent.click(within(management).getByRole('button', {name: /reset team 1/i}))

    let teamDialog = screen.getByRole('dialog', {name: /reset team 1/i})
    expect(teamDialog).toBeInTheDocument()
    fireEvent.click(within(teamDialog).getByRole('button', {name: /^cancel$/i}))
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /reset team 1/i}))
    teamDialog = screen.getByRole('dialog', {name: /reset team 1/i})
    fireEvent.click(within(teamDialog).getByRole('button', {name: /reset team/i}))
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /apply d-tide 5/i}))
    teamDialog = screen.getByRole('dialog', {name: /apply d-tide 5/i})
    expect(teamDialog).toBeInTheDocument()
    fireEvent.click(within(teamDialog).getByRole('button', {name: /^apply$/i}))
    expect(within(management).getByRole('button', {name: /select wave 5/i})).toBeInTheDocument()
  })

  it('exposes provisional team management on adaptive and mobile layouts', () => {
    resizeBuilderV2Viewport(900)
    const {unmount} = render(<BuilderV2Page />)

    const adaptiveManagement = screen.getByRole('region', {
      name: /builder v2 team management/i,
    })
    fireEvent.click(within(adaptiveManagement).getByRole('button', {name: /add team/i}))
    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByRole('region', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /expand adaptive picker/i})).toHaveAttribute(
      'aria-expanded',
      'false',
    )

    unmount()
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const mobileManagement = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(mobileManagement).getByRole('button', {name: /add team/i}))
    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByRole('region', {name: /mobile team builder/i})).toBeInTheDocument()
  })

  it('renders an adaptive workbench instead of the mobile app or desktop armory at tablet widths', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /adaptive workbench/i})).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile team builder/i})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', {name: /builder v2 armory/i}),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /open adaptive picker/i})).not.toBeInTheDocument()
    expect(screen.getByRole('complementary', {name: /my teams/i})).toBeInTheDocument()
  })

  it('disables builder drag affordances on touch-type devices while keeping click assignment', () => {
    mockBuilderV2TouchDevice(true)
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    const goliathTile = within(dock).getByRole('button', {name: /goliath, level \d+/i})
    expect(goliathTile).not.toHaveAttribute('aria-roledescription', 'draggable')

    fireEvent.click(goliathTile)

    const slotTrigger = screen.getByRole('button', {name: /^select slot 1$/i})
    expect(slotTrigger).not.toHaveAttribute('aria-roledescription', 'draggable')
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
  })

  it('does not advertise pointer-only drag affordances as keyboard-draggable', () => {
    mockBuilderV2TouchDevice(false)
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    expect(screen.getByRole('button', {name: /goliath, level \d+/i})).not.toHaveAttribute(
      'aria-roledescription',
      'draggable',
    )
  })

  it('switches teams through the adaptive compact team rail', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    const adaptiveTeams = screen.getByRole('complementary', {name: /my teams/i})
    fireEvent.click(within(adaptiveTeams).getByRole('button', {name: /02 team 2 1 \/ 4 deployed/i}))

    expect(screen.getByRole('heading', {level: 2, name: /team 2/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - awakener/i)).toBeInTheDocument()
  })

  it('opens an adaptive picker dock from slot selection with search focus and Escape focus return', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const slotTrigger = screen.getByRole('button', {name: /^select slot 1$/i})
    fireEvent.click(slotTrigger)

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    expect(dock).toBeInTheDocument()
    expect(dock).toHaveClass('builder-v2-adaptive-picker')
    expect(document.querySelector('.builder-v2-adaptive-workbench')).not.toHaveAttribute(
      'aria-hidden',
    )
    expect(within(dock).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(dock).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.getByRole('region', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /expand adaptive picker/i})).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(
      within(screen.getByRole('region', {name: /adaptive picker/i})).queryByRole('searchbox', {
        name: /search awakeners/i,
      }),
    ).not.toBeInTheDocument()
    expect(slotTrigger).toHaveFocus()
  })

  it('restores adaptive picker focus to slot triggers without reusing stale opener refs', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const firstSlotTrigger = screen.getByRole('button', {name: /^select slot 1$/i})
    fireEvent.click(firstSlotTrigger)
    fireEvent.keyDown(document, {key: 'Escape'})
    expect(firstSlotTrigger).toHaveFocus()
    expect(screen.getByRole('button', {name: /expand adaptive picker/i})).toBeInTheDocument()

    const secondSlotTrigger = screen.getByRole('button', {name: /^select slot 2$/i})
    secondSlotTrigger.focus()
    fireEvent.click(secondSlotTrigger)
    expect(
      within(screen.getByRole('region', {name: /adaptive picker/i})).getByRole('searchbox', {
        name: /search awakeners/i,
      }),
    ).toHaveFocus()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.getByRole('region', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(secondSlotTrigger).toHaveFocus()
  })

  it('restores adaptive picker focus after direct expand control opening', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const expandButton = screen.getByRole('button', {name: /expand adaptive picker/i})
    fireEvent.click(expandButton)

    const collapseButton = screen.getByRole('button', {name: /collapse adaptive picker/i})
    expect(collapseButton).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.getByRole('button', {name: /expand adaptive picker/i})).toHaveFocus()
  })

  it('renders the adaptive picker dock inline without modal scroll locking', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    expect(dock.parentElement).toHaveClass('builder-v2-adaptive-primary-stack')
    expect(document.body.style.overflow).toBe('')
    expect(document.querySelector('.builder-v2-adaptive-workbench')).not.toHaveAttribute(
      'aria-hidden',
    )
  })

  it('opens the adaptive picker dock on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 2$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    expect(within(dock).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(dock).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
  })

  it('opens the adaptive picker on awakeners when an empty gear target is tapped', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    expect(dock).toBeInTheDocument()
    expect(within(dock).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(dock).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()
  })

  it('keeps the adaptive picker open when an awakened slot has no empty wheel target', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const fullWheelSlots = createEmptyTeamSlots()
    fullWheelSlots[0] = {
      ...fullWheelSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
      wheels: ['wheel-0050', 'wheel-0051'],
    }

    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [{id: 'team-1', name: 'Team 1', slots: fullWheelSlots}],
      })
    })

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    fireEvent.click(within(dock).getByRole('tab', {name: /^wheels$/i}))
    fireEvent.click(within(dock).getByRole('button', {name: /signal through silence, ssr/i}))

    expect(screen.getByRole('region', {name: /adaptive picker/i})).toBeInTheDocument()
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent(/select a wheel slot or an awakened slot/i)
    expect(dock).toHaveAttribute('aria-describedby', alert.id)
  })

  it('imports a single t1 code into an empty active V2 team', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    const importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.change(within(importDialog).getByRole('textbox', {name: /import code/i}), {
      target: {value: encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))},
    })
    fireEvent.click(within(importDialog).getByRole('button', {name: /^import$/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(screen.getByText(/team imported/i)).toBeInTheDocument()
  })

  it('exposes import and export actions from adaptive and mobile shells', () => {
    resizeBuilderV2Viewport(900)
    const {unmount} = render(<BuilderV2Page />)

    expect(
      screen.getByRole('group', {name: /builder v2 import and export actions/i}),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    expect(screen.getByRole('dialog', {name: /import teams/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^cancel$/i}))

    unmount()
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    expect(
      screen.getByRole('group', {name: /builder v2 import and export actions/i}),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^export all$/i}))
    expect(screen.getByRole('dialog', {name: /export all teams/i})).toBeInTheDocument()
  })

  it('imports mt1 codes after replace confirmation and activates the encoded active team', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const teamA = makeImportTeam('Alpha', 'goliath')
    const teamB = makeImportTeam('Beta', 'ramona')
    const multiTeamCode = encodeMultiTeamCode([teamA, teamB], teamB.id)

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    const importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.change(within(importDialog).getByRole('textbox', {name: /import code/i}), {
      target: {value: multiTeamCode},
    })
    fireEvent.click(within(importDialog).getByRole('button', {name: /^import$/i}))

    expect(screen.getByRole('dialog', {name: /replace current teams/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^replace$/i}))

    expect(screen.getByRole('button', {name: /02 team 2 1 \/ 4 deployed/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove ramona/i})).toBeInTheDocument()
  })

  it('confirms duplicate-illegal imports before replacing V2 teams', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const teamA = makeImportTeam('Alpha', 'goliath')
    const teamB = makeImportTeam('Beta', 'goliath')
    const duplicateCode = encodeMultiTeamCode([teamA, teamB], teamA.id)

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    const importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.change(within(importDialog).getByRole('textbox', {name: /import code/i}), {
      target: {value: duplicateCode},
    })
    fireEvent.click(within(importDialog).getByRole('button', {name: /^import$/i}))

    expect(screen.getByRole('dialog', {name: /import uses duplicates/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /enable and import/i}))

    expect(screen.queryByRole('dialog', {name: /import uses duplicates/i})).not.toBeInTheDocument()
    expect(window.localStorage.getItem('skeydb.builder.allowDupes.v1')).toBe('1')
    expect(screen.getByRole('dialog', {name: /replace current teams/i})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^replace$/i}))

    expect(screen.getByRole('button', {name: /01 team 1 1 \/ 4 deployed/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /02 team 2 1 \/ 4 deployed/i})).toBeInTheDocument()
  })

  it('exports the active V2 team, all teams, and the active team in in-game format', () => {
    const alphaSlots = createEmptyTeamSlots()
    alphaSlots[0] = {
      ...alphaSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 90,
      isSupport: true,
    }
    const betaSlots = createEmptyTeamSlots()
    betaSlots[0] = {
      ...betaSlots[0],
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      level: 60,
    }
    saveBuilderDraft(window.localStorage, {
      activeTeamId: 'team-alpha',
      teams: [
        {id: 'team-alpha', name: 'Alpha', slots: alphaSlots},
        {id: 'team-beta', name: 'Beta', slots: betaSlots},
      ],
    })

    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /export active/i}))
    let exportDialog = screen.getByRole('dialog', {name: /export alpha/i})
    let exportCode = getRequiredTextArea(
      within(exportDialog).getByRole('textbox', {name: /export code/i}),
    )
    let parsed = decodeImportCode(exportCode.value)
    expect(parsed.kind).toBe('single')
    fireEvent.click(within(exportDialog).getByRole('button', {name: /^close$/i}))

    fireEvent.click(screen.getByRole('button', {name: /export all/i}))
    exportDialog = screen.getByRole('dialog', {name: /export all teams/i})
    exportCode = getRequiredTextArea(
      within(exportDialog).getByRole('textbox', {name: /export code/i}),
    )
    parsed = decodeImportCode(exportCode.value)
    expect(parsed.kind).toBe('multi')
    if (parsed.kind === 'multi') {
      expect(parsed.teams[0]?.slots[0]?.isSupport).toBe(true)
    }
    fireEvent.click(within(exportDialog).getByRole('button', {name: /^close$/i}))

    fireEvent.click(screen.getByRole('button', {name: /export in-game/i}))
    exportDialog = screen.getByRole('dialog', {name: /export in-game alpha/i})
    exportCode = getRequiredTextArea(
      within(exportDialog).getByRole('textbox', {name: /export code/i}),
    )
    expect(exportCode.value.startsWith('@@')).toBe(true)
    expect(exportCode.value.endsWith('@@')).toBe(true)
  })

  it('resolves single-team import conflicts through the strategy dialog', () => {
    const teamOneSlots = createEmptyTeamSlots()
    teamOneSlots[0] = {
      ...teamOneSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    saveBuilderDraft(window.localStorage, {
      activeTeamId: 'team-2',
      teams: [
        {id: 'team-1', name: 'Team 1', slots: teamOneSlots},
        {id: 'team-2', name: 'Team 2', slots: createEmptyTeamSlots()},
      ],
    })

    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    const importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.change(within(importDialog).getByRole('textbox', {name: /import code/i}), {
      target: {value: encodeSingleTeamCode(makeImportTeam('Incoming', 'goliath'))},
    })
    fireEvent.click(within(importDialog).getByRole('button', {name: /^import$/i}))

    const strategyDialog = screen.getByRole('dialog', {name: /resolve import conflicts/i})
    expect(within(strategyDialog).getByText(/conflicts with team 1/i)).toBeInTheDocument()

    fireEvent.click(within(strategyDialog).getByRole('button', {name: /skip duplicates/i}))

    expect(screen.getByText(/team imported/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /01 team 1 1 \/ 4 deployed/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
  })

  it('opens an accessible transfer dialog before moving an in-use V2 awakener', () => {
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    saveBuilderDraft(window.localStorage, {
      activeTeamId: 'team-1',
      teams: [
        {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
        {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
      ],
    })

    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 2$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath.*in use/i}))

    const transferDialog = screen.getByRole('dialog', {name: /move goliath/i})
    expect(within(transferDialog).getByText(/already used in team 2/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(within(transferDialog).getByRole('button', {name: /^cancel$/i}))

    expect(screen.queryByRole('dialog', {name: /move goliath/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /goliath.*in use/i}))
    fireEvent.click(screen.getByRole('button', {name: /^move instead$/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /02 team 2 0 \/ 4 deployed/i}))

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
  })

  it('hands adaptive dock assignment to one transfer confirmation dialog', () => {
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    saveBuilderDraft(window.localStorage, {
      activeTeamId: 'team-1',
      teams: [
        {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
        {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
      ],
    })

    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    fireEvent.click(within(dock).getByRole('button', {name: /goliath.*in use/i}))

    expect(screen.getByRole('region', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(screen.getByRole('dialog', {name: /move goliath/i})).toBeInTheDocument()
    expect(document.querySelector('.builder-v2-adaptive-workbench')).not.toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('renders the mobile builder with team navigation and active slot targets', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const mobileBuilder = screen.getByRole('region', {name: /mobile team builder/i})
    expect(within(mobileBuilder).getByRole('combobox', {name: /active team/i})).toBeInTheDocument()
    expect(within(mobileBuilder).getByRole('button', {name: /previous team/i})).toBeInTheDocument()
    expect(within(mobileBuilder).getByRole('button', {name: /next team/i})).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile focused builder/i})).not.toBeInTheDocument()

    const activeSlots = within(mobileBuilder).getByLabelText(/builder v2 active team slots/i)
    expect(within(activeSlots).getAllByRole('button', {name: /^select slot \d$/i})).toHaveLength(4)
    expect(
      within(activeSlots).getByRole('button', {name: /^select slot 2 wheel 1$/i}),
    ).toBeInTheDocument()
  })

  it('opens the mobile picker drawer from an active team slot without summoning search focus', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const slotTrigger = screen.getByRole('button', {name: /^select slot 2$/i})
    fireEvent.click(slotTrigger)

    const drawer = screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
    expect(drawer).toHaveFocus()
    expect(screen.getByText(/editing slot 2 - awakener/i)).toBeInTheDocument()
  })

  it('keeps the mobile picker drawer mounted behind database details', async () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 2$/i}))

    const drawer = screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})
    fireEvent.click(within(drawer).getByTitle('View Goliath details'))

    expect(dbDetailStore.getState().stack.at(-1)).toEqual({
      kind: 'awakener',
      id: 'awakener-0021',
      source: 'builder-overlay',
    })

    expect(document.querySelector('.builder-v2-mobile-picker')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('.builder-v2-mobile-picker')).toHaveAttribute('inert')
    })
  })

  it('opens the mobile picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    let drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /goliath, level \d+/i}))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 2$/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · wheel 2/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - wheel 2/i)).toBeInTheDocument()
  })

  it('closes the mobile picker drawer with Escape and returns focus to the invoking target', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /^select slot 3$/i})
    fireEvent.click(pickerTrigger)

    expect(screen.getByRole('dialog', {name: /team 1 · slot 3 · awakener/i})).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(
      screen.queryByRole('dialog', {name: /team 1 · slot 3 · awakener/i}),
    ).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('keeps the same mobile target when reopening a picker after closing it', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const slotTrigger = screen.getByRole('button', {name: /^select slot 2$/i})
    fireEvent.click(slotTrigger)
    fireEvent.keyDown(document, {key: 'Escape'})
    fireEvent.click(slotTrigger)
    const drawer = screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /goliath, level \d+/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /^select slot 2 wheel 1$/i})).toBeInTheDocument()
  })

  it('runs mobile quick lineup as a full-team surface with inline picker and bottom slot controls', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    expect(within(lineup).getByText(/step 1 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 1 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('button', {name: /previous slot/i})).toBeDisabled()
    expect(within(lineup).getByRole('button', {name: /next slot/i})).toBeInTheDocument()
    expect(within(lineup).getByRole('button', {name: /select team posse/i})).toBeInTheDocument()
    expect(
      within(lineup).getByRole('button', {name: /finish quick team lineup/i}),
    ).toBeInTheDocument()
    expect(
      within(lineup).getByRole('group', {name: /quick lineup team overview/i}),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile focused builder/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      within(lineup).queryByRole('navigation', {name: /quick lineup steps/i}),
    ).not.toBeInTheDocument()

    const overview = within(lineup).getByRole('group', {
      name: /quick lineup team overview/i,
    })
    expect(within(overview).getAllByRole('button', {name: /^select slot \d$/i})).toHaveLength(4)
    expect(
      within(lineup).queryByRole('heading', {name: /slot 1 · awakener/i}),
    ).not.toBeInTheDocument()
    expect(within(lineup).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(lineup).getByRole('button', {name: /^select slot 1 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )

    fireEvent.click(within(lineup).getByRole('button', {name: /goliath, level \d+/i}))

    expect(within(lineup).getByText(/step 2 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 1 · wheel 1/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const slotControls = within(lineup).getByRole('region', {
      name: /quick lineup slot controls/i,
    })
    expect(
      within(slotControls).queryByRole('button', {name: /finish quick team lineup/i}),
    ).not.toBeInTheDocument()
    expect(
      within(slotControls).getByRole('button', {name: /^select slot 1 wheel 1$/i}),
    ).toHaveAttribute('aria-current', 'step')

    fireEvent.click(within(lineup).getByRole('button', {name: /next slot/i}))

    expect(within(lineup).getByText(/step 5 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 2 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(lineup).getByRole('button', {name: /^select slot 2 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('moves mobile quick lineup between awakener slots with bottom slot controls', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const nextSlot = within(lineup).getByRole('button', {name: /next slot/i})

    fireEvent.click(nextSlot)

    expect(within(lineup).getByText(/step 5 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 2 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('button', {name: /^select slot 2 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )

    fireEvent.click(within(lineup).getByRole('button', {name: /previous slot/i}))

    expect(within(lineup).getByText(/step 1 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 1 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('button', {name: /^select slot 1 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )

    fireEvent.click(within(lineup).getByRole('button', {name: /next slot/i}))
    fireEvent.click(within(lineup).getByRole('button', {name: /next slot/i}))
    fireEvent.click(within(lineup).getByRole('button', {name: /previous slot/i}))

    expect(within(lineup).getByText(/step 5 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 2 · awakener/i)).toBeInTheDocument()

    fireEvent.click(within(lineup).getByRole('button', {name: /next slot/i}))

    expect(within(lineup).getByText(/step 9 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 3 · awakener/i)).toBeInTheDocument()
  })

  it('renders mobile quick lineup with a compact four-slot overview row', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const overview = within(lineup).getByRole('group', {
      name: /quick lineup team overview/i,
    })
    const overviewSlots = within(overview).getAllByRole('group', {
      name: /slot \d quick overview/i,
    })

    expect(overview).toHaveClass('builder-v2-mobile-lineup-overview')
    expect(overviewSlots).toHaveLength(4)
    expect(
      within(overviewSlots[0]).getByRole('button', {name: /^select slot 1$/i}),
    ).toBeInTheDocument()
    expect(within(overviewSlots[0]).queryByText(/^slot 1$/i)).not.toBeInTheDocument()
    expect(
      within(overviewSlots[0]).getByRole('button', {
        name: /^select slot 1 awakener before wheel 1$/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(overviewSlots[0]).getByRole('button', {
        name: /^select slot 1 awakener before wheel 2$/i,
      }),
    ).toBeInTheDocument()
    expect(
      within(overviewSlots[0]).getByRole('button', {
        name: /^select slot 1 awakener before covenant$/i,
      }),
    ).toBeInTheDocument()
  })

  it('routes empty mobile quick lineup gear targets back to their awakener slot', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const overview = within(lineup).getByRole('group', {
      name: /quick lineup team overview/i,
    })
    const overviewSlots = within(overview).getAllByRole('group', {
      name: /slot \d quick overview/i,
    })

    fireEvent.click(
      within(overviewSlots[1]).getByRole('button', {
        name: /^select slot 2 awakener before wheel 1$/i,
      }),
    )

    expect(within(lineup).getByText(/step 5 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 2 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )

    fireEvent.click(
      within(overviewSlots[2]).getByRole('button', {
        name: /^select slot 3 awakener before covenant$/i,
      }),
    )

    expect(within(lineup).getByText(/step 9 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 3 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('opens the awakener picker when an empty mobile gear slot is tapped', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 2 wheel 1$/i}))

    expect(screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute('aria-selected', 'true')
  })

  it('places mobile quick lineup picker filters near search and tabs below the results', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const picker = within(lineup).getByRole('region', {name: /slot 1 · awakener/i})
    const toolbar = picker.querySelector('.builder-v2-picker-toolbar')
    const filters = picker.querySelector('.builder-v2-picker-filter-stack')
    const results = picker.querySelector('.builder-v2-picker-results')
    const bottomControls = picker.querySelector('.builder-v2-picker-bottom-controls')
    const tabs = within(picker).getByRole('tablist', {name: /picker categories/i})

    expect(toolbar).not.toBeNull()
    expect(filters).not.toBeNull()
    expect(results).not.toBeNull()
    expect(bottomControls).not.toBeNull()
    if (!toolbar || !filters || !results || !bottomControls) {
      throw new Error('Expected quick lineup picker controls and results')
    }
    expect(
      Boolean(toolbar.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(
      Boolean(filters.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(
      Boolean(results.compareDocumentPosition(bottomControls) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(Boolean(results.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(
      true,
    )
  })

  it('selects a slot and assigns an awakener there', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 3$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))

    const activeSlots = screen.getByLabelText(/builder v2 active team slots/i)
    const slot3 = within(activeSlots).getByText('Slot 3').closest('article')
    if (!slot3) {
      throw new Error('Expected slot 3 article to render')
    }
    expect(within(slot3).getByText(/^Goliath$/)).toBeInTheDocument()
    expect(screen.getByText(/editing slot 3 - awakener/i)).toBeInTheDocument()
  })

  it('removes an assigned awakener from a slot', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    fireEvent.click(screen.getByRole('button', {name: /remove goliath/i}))

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
  })

  it('assigns and clears wheel and covenant loadout targets', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing, ssr/i}))

    const activeSlots = screen.getByLabelText(/builder v2 active team slots/i)
    const slot1 = within(activeSlots).getByText('Slot 1').closest('article')
    if (!slot1) {
      throw new Error('Expected slot 1 article to render')
    }
    expect(within(slot1).getByRole('button', {name: /clear slot 1 wheel 1/i})).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 wheel 1/i}))
    expect(
      within(slot1).queryByRole('button', {name: /clear slot 1 wheel 1/i}),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 covenant$/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina, recommended/i}))
    expect(within(slot1).getByText(/deus ex machina/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 covenant/i}))
    expect(within(slot1).queryByText(/deus ex machina/i)).not.toBeInTheDocument()
  })

  it('assigns and clears the team posse target', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /select team posse/i}))
    fireEvent.click(screen.getByRole('button', {name: /taverns opening, chaos/i}))

    expect(screen.getByRole('button', {name: /clear posse/i})).toBeInTheDocument()
    expect(screen.getByText(/editing team 1 - posse/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /clear posse/i}))

    expect(screen.queryByRole('button', {name: /clear posse/i})).not.toBeInTheDocument()
  })

  it('drives quick lineup through visible V2 controls and picker tabs', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    expect(screen.getByText(/step 1 \/ 17: slot 1 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 3 \/ 17: slot 1 - wheel 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
  })

  it('cancels quick lineup and restores the original V2 team', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath, level \d+/i}))
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /cancel quick team lineup/i}))

    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(screen.queryByText(/step 1 \/ 17/i)).not.toBeInTheDocument()
  })

  it('is reachable through /builder-v2 without adding a nav link', async () => {
    render(
      <MemoryRouter initialEntries={['/builder-v2']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).queryByRole('link', {name: /builder v2/i})).not.toBeInTheDocument()
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toBeInTheDocument()
  })
})
