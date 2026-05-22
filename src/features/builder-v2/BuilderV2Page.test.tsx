import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'
import {decodeImportCode, encodeMultiTeamCode, encodeSingleTeamCode} from '@/domain/import-export'
import {builderDraftStore} from '@/stores/builderDraftStore'

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

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  )
}

afterEach(() => {
  resizeBuilderV2Viewport(1200, false)
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
    expect(within(management).getByText(/taverns opening/i)).toBeInTheDocument()
    expect(within(management).getByText(/support/i)).toBeInTheDocument()
    expect(within(management).getByText(/goliath/i)).toBeInTheDocument()
    expect(within(management).getByText(/1 wheel/i)).toBeInTheDocument()
    expect(within(management).getByText(/covenant/i)).toBeInTheDocument()

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
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
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
    expect(screen.queryByRole('dialog', {name: /adaptive picker/i})).not.toBeInTheDocument()

    unmount()
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const mobileManagement = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(mobileManagement).getByRole('button', {name: /add team/i}))
    expect(screen.getByRole('heading', {level: 1, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByRole('region', {name: /mobile team overview/i})).toBeInTheDocument()
  })

  it('renders an adaptive workbench instead of the mobile app or desktop armory at tablet widths', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /adaptive workbench/i})).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile team overview/i})).not.toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', {name: /builder v2 armory/i}),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: /open adaptive picker/i})).toBeInTheDocument()
    expect(screen.getByRole('group', {name: /adaptive teams/i})).toBeInTheDocument()
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

    const adaptiveTeams = screen.getByRole('group', {name: /adaptive teams/i})
    fireEvent.click(within(adaptiveTeams).getByRole('button', {name: /02 team 2 1 \/ 4 deployed/i}))

    expect(screen.getByRole('heading', {level: 2, name: /team 2/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - awakener/i)).toBeInTheDocument()
  })

  it('opens an adaptive picker drawer with search focus and Escape focus return', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /open adaptive picker/i})
    fireEvent.click(pickerTrigger)

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(drawer).toBeInTheDocument()
    expect(drawer.parentElement).toHaveClass('builder-v2-adaptive-picker-backdrop')
    expect(document.querySelector('.builder-v2-adaptive-workbench')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.queryByRole('dialog', {name: /adaptive picker/i})).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('restores adaptive picker focus to slot triggers without reusing stale opener refs', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /open adaptive picker/i})
    fireEvent.click(pickerTrigger)
    fireEvent.keyDown(document, {key: 'Escape'})
    expect(pickerTrigger).toHaveFocus()

    const slotTrigger = screen.getByRole('button', {name: /^select slot 1$/i})
    slotTrigger.focus()
    fireEvent.click(slotTrigger)
    expect(
      within(screen.getByRole('dialog', {name: /adaptive picker/i})).getByRole('searchbox', {
        name: /search awakeners/i,
      }),
    ).toHaveFocus()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(screen.queryByRole('dialog', {name: /adaptive picker/i})).not.toBeInTheDocument()
    expect(slotTrigger).toHaveFocus()
  })

  it('keeps Tab navigation contained in the adaptive picker drawer', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /open adaptive picker/i})
    fireEvent.click(pickerTrigger)

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    const focusableElements = getFocusableElements(drawer)
    if (focusableElements.length === 0) {
      throw new Error('Expected adaptive picker drawer to contain focusable controls')
    }
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    lastFocusable.focus()
    fireEvent.keyDown(lastFocusable, {key: 'Tab'})
    expect(firstFocusable).toHaveFocus()

    firstFocusable.focus()
    fireEvent.keyDown(firstFocusable, {key: 'Tab', shiftKey: true})
    expect(lastFocusable).toHaveFocus()

    pickerTrigger.focus()
    fireEvent.keyDown(pickerTrigger, {key: 'Tab'})
    expect(firstFocusable).toHaveFocus()
  })

  it('opens the adaptive picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 2$/i}))

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
  })

  it('keeps the adaptive picker open and surfaces violations when an assignment target is invalid', () => {
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('alert')).toHaveTextContent(/wheels require an awakener/i)
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

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    fireEvent.click(within(drawer).getByRole('tab', {name: /^wheels$/i}))
    fireEvent.click(within(drawer).getByRole('button', {name: /signal through silence/i}))

    expect(screen.getByRole('dialog', {name: /adaptive picker/i})).toBeInTheDocument()
    expect(within(drawer).getByRole('alert')).toHaveTextContent(
      /select a wheel slot or an awakened slot/i,
    )
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

  it('hands adaptive drawer assignment to one transfer confirmation dialog', () => {
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

    const drawer = screen.getByRole('dialog', {name: /adaptive picker/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /goliath.*in use/i}))

    expect(screen.queryByRole('dialog', {name: /adaptive picker/i})).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', {name: /move goliath/i})).toBeInTheDocument()
    expect(document.querySelector('.builder-v2-adaptive-workbench')).not.toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('renders the mobile overview and enters the focused slot builder', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    expect(screen.getByRole('region', {name: /mobile team overview/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))

    expect(screen.getByRole('region', {name: /mobile focused builder/i})).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()
  })

  it('opens the mobile picker drawer from a focused slot and focuses search', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))

    const drawer = screen.getByRole('dialog', {name: /pick awakener for slot 2/i})
    expect(drawer).toBeInTheDocument()
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 2 - awakener/i)).toBeInTheDocument()
  })

  it('opens the mobile picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 1 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))

    const drawer = screen.getByRole('dialog', {name: /pick wheel 2 for goliath/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toHaveFocus()
    expect(screen.getByText(/editing slot 1 - wheel 2/i)).toBeInTheDocument()
  })

  it('closes the mobile picker drawer with Escape and returns focus to the invoking target', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 3 builder/i}))
    const pickerTrigger = screen.getByRole('button', {name: /pick awakener for slot 3/i})
    fireEvent.click(pickerTrigger)

    expect(screen.getByRole('dialog', {name: /pick awakener for slot 3/i})).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(
      screen.queryByRole('dialog', {name: /pick awakener for slot 3/i}),
    ).not.toBeInTheDocument()
    expect(pickerTrigger).toHaveFocus()
  })

  it('keeps the same mobile target when reopening a picker after closing it', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /open slot 2 builder/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.keyDown(document, {key: 'Escape'})
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 2/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick wheel 1 for goliath/i})).toBeInTheDocument()
  })

  it('syncs the mobile focused slot when quick lineup advances to the next slot', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick awakener for slot 1/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 1 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick wheel 2 for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /tablet of scriptures/i}))
    fireEvent.click(screen.getByRole('button', {name: /pick covenant for goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /pick awakener for slot 2/i})).toBeInTheDocument()

    const lineupControls = screen.getByLabelText(/mobile quick lineup controls/i)

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 4 \/ 17: slot 1 - covenant/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /goliath/i})).toBeInTheDocument()

    fireEvent.click(within(lineupControls).getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 5 \/ 17: slot 2 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', {level: 2, name: /slot 2/i})).toBeInTheDocument()
  })

  it('selects a slot and assigns an awakener there', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 3$/i}))
    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

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

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /remove goliath/i}))

    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
    expect(screen.getAllByText(/empty slot/i)).toHaveLength(4)
  })

  it('assigns and clears wheel and covenant loadout targets', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /^select slot 1 wheel 1$/i}))
    fireEvent.click(screen.getByRole('button', {name: /merciful nurturing/i}))

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
    fireEvent.click(screen.getByRole('button', {name: /deus ex machina/i}))
    expect(within(slot1).getByText(/deus ex machina/i)).toBeInTheDocument()

    fireEvent.click(within(slot1).getByRole('button', {name: /clear slot 1 covenant/i}))
    expect(within(slot1).queryByText(/deus ex machina/i)).not.toBeInTheDocument()
  })

  it('assigns and clears the team posse target', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /select team posse/i}))
    fireEvent.click(screen.getByRole('button', {name: /taverns opening/i}))

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

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('button', {name: /^next$/i}))

    expect(screen.getByText(/step 3 \/ 17: slot 1 - wheel 2/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^back$/i}))

    expect(screen.getByText(/step 2 \/ 17: slot 1 - wheel 1/i)).toBeInTheDocument()
  })

  it('cancels quick lineup and restores the original V2 team', () => {
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
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
