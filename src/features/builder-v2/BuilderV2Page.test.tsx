import {useMemo, useState} from 'react'

import {DndContext} from '@dnd-kit/core'
import {act, cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import './builder-v2-test-mocks'

import App from '@/App'
import {decodeImportCode, encodeMultiTeamCode, encodeSingleTeamCode} from '@/domain/import-export'
import {clearDatabaseDetailRecordCacheForTests} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {builderDraftStore} from '@/stores/builderDraftStore'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {saveBuilderDraft} from '../builder/builder-persistence'
import {createEmptyTeamSlots} from '../builder/constants'
import type {Team} from '../builder/types'
import type {BuilderV2DropTargetDescriptor} from './builder-v2-dnd'
import {BuilderV2AwakenerPicker} from './BuilderV2AwakenerPicker'
import type {
  BuilderV2AwakenerOption,
  BuilderV2PickerModel,
  BuilderV2PickerTab,
  BuilderV2TeamSummary,
  BuilderV2TeamSummarySlot,
  BuilderV2WheelOption,
} from './BuilderV2ModelTypes'
import {BuilderV2Page} from './BuilderV2Page'
import {TeamSlotSummary} from './BuilderV2TeamManagement'

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

function setPickerResultPanelLayout(panel: HTMLElement) {
  Object.defineProperty(panel, 'clientHeight', {
    configurable: true,
    value: 336,
  })
  Object.defineProperty(panel, 'clientWidth', {
    configurable: true,
    value: 320,
  })
  Object.defineProperty(panel, 'scrollTop', {
    configurable: true,
    writable: true,
    value: 0,
  })
}

function createWindowedTestAwakeners(): BuilderV2AwakenerOption[] {
  return Array.from({length: 64}, (_, index) => ({
    id: `test-awakener-${String(index + 1).padStart(2, '0')}`,
    name: index === 58 ? 'deep awakener' : `test awakener ${String(index + 1)}`,
    displayName: index === 58 ? 'Deep Awakener' : `Test Awakener ${String(index + 1)}`,
    realm: 'CHAOS',
    portraitSrc: undefined,
    inUse: false,
    inUseLabel: null,
    owned: true,
    level: 60 + index,
    enlightenLevel: null,
    blocked: false,
    blockReason: null,
  }))
}

function createWindowedTestWheels(): BuilderV2WheelOption[] {
  return Array.from({length: 64}, (_, index) => ({
    id: `test-wheel-${String(index + 1).padStart(2, '0')}`,
    name: index === 58 ? 'Deep Wheel' : `Test Wheel ${String(index + 1)}`,
    rarity: index % 3 === 0 ? 'SSR' : index % 3 === 1 ? 'SR' : 'R',
    realm: 'AEQUOR',
    mainstat: 'Crit Rate',
    mainstatKey: 'CRIT_RATE',
    assetSrc: undefined,
    inUse: false,
    inUseLabel: null,
    owned: true,
    enlightenLevel: null,
    recommended: false,
    recommendationLabel: null,
    recommendedMainstatKey: null,
  }))
}

function makeFeedbackTestWheel(index: number) {
  return {
    id: `feedback-wheel-${String(index)}`,
    name: `Feedback Wheel ${String(index)}`,
    miniAssetSrc: undefined,
    assetSrc: undefined,
    enlightenLevel: null,
    isOwned: true,
  }
}

function makeFeedbackTestSlot(): BuilderV2TeamSummarySlot {
  return {
    slotId: 'slot-1',
    label: 'Slot 1',
    slotNumber: 1,
    name: 'Slot 1',
    awakener: {
      id: 'awakener-feedback',
      name: 'feedback awakener',
      displayName: 'Feedback Awakener',
      realm: 'CHAOS',
      level: 60,
      enlightenLevel: null,
      cardSrc: undefined,
      portraitSrc: undefined,
      isOwned: true,
      isSupport: false,
    },
    portraitSrc: undefined,
    cardSrc: undefined,
    isEmpty: false,
    isSupport: false,
    wheelCount: 2,
    wheels: [makeFeedbackTestWheel(1), makeFeedbackTestWheel(2)],
    hasCovenant: true,
    covenant: {
      id: 'feedback-covenant',
      name: 'Feedback Covenant',
      assetSrc: undefined,
    },
  }
}

function makeFeedbackTestTeam(slot: BuilderV2TeamSummarySlot): BuilderV2TeamSummary {
  return {
    id: 'team-feedback',
    name: 'Feedback Team',
    isActive: true,
    deployedCount: 1,
    slotNames: [slot.name],
    slots: [slot],
    posseName: null,
    posseRealm: null,
    posseAssetSrc: undefined,
    isPosseOwned: true,
    isEmpty: false,
  }
}

function renderTeamManagementFeedbackTarget(predictedDropTarget: BuilderV2DropTargetDescriptor) {
  const slot = makeFeedbackTestSlot()
  const team = makeFeedbackTestTeam(slot)

  render(
    <DndContext>
      <ul>
        <TeamSlotSummary
          enableLoadoutSelect
          enableSlotDragAndDrop
          isDragActive
          onSelect={vi.fn()}
          predictedDropTarget={predictedDropTarget}
          previewMode='expanded'
          slot={slot}
          team={team}
        />
      </ul>
    </DndContext>,
  )

  const slotSummary = screen.getByLabelText(/slot 1, feedback awakener/i)
  const covenantButton = screen.getByRole('button', {name: /edit feedback team slot 1 covenant/i})
  const wheelButtons = screen.getAllByRole('button', {name: /edit wheel/i})

  return {covenantButton, slotSummary, wheelButtons}
}

function WindowedPickerHarness({
  awakeners = createWindowedTestAwakeners(),
  onAssignAwakener = vi.fn(),
  onAssignWheel = vi.fn(),
  tab,
  wheels = createWindowedTestWheels(),
}: {
  awakeners?: BuilderV2AwakenerOption[]
  onAssignAwakener?: (awakenerId: string) => void
  onAssignWheel?: (wheelId: string) => void
  tab: BuilderV2PickerTab
  wheels?: BuilderV2WheelOption[]
}) {
  const [activeTab, setActiveTab] = useState(tab)
  const [searchQuery, setSearchQuery] = useState('')
  const visibleAwakeners = useMemo(
    () =>
      awakeners.filter((awakener) =>
        awakener.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [awakeners, searchQuery],
  )
  const visibleWheels = useMemo(
    () => wheels.filter((wheel) => wheel.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery, wheels],
  )
  const picker: BuilderV2PickerModel = {
    tab: activeTab,
    searchQuery,
    awakeners: activeTab === 'awakeners' ? visibleAwakeners : [],
    wheels: activeTab === 'wheels' ? visibleWheels : [],
    covenants: [],
    posses: [],
    preferences: {
      awakenerFilter: 'ALL',
      posseFilter: 'ALL',
      wheelRarityFilter: 'ALL',
      wheelMainstatFilter: 'ALL',
      awakenerSortKey: 'LEVEL',
      awakenerSortDirection: 'DESC',
      awakenerSortGroupByRealm: false,
      wheelSortKey: 'RARITY',
      wheelSortDirection: 'DESC',
      displayUnowned: true,
      sinkUnownedToBottom: false,
      allowDupes: false,
      promoteRecommendedGear: false,
      promoteMatchingWheelMainstats: false,
    },
    setTab: setActiveTab,
    setSearchQuery,
    setAwakenerFilter: vi.fn(),
    setPosseFilter: vi.fn(),
    setWheelRarityFilter: vi.fn(),
    setWheelMainstatFilter: vi.fn(),
    setAwakenerSortKey: vi.fn(),
    toggleAwakenerSortDirection: vi.fn(),
    setAwakenerSortGroupByRealm: vi.fn(),
    setWheelSortKey: vi.fn(),
    toggleWheelSortDirection: vi.fn(),
    setDisplayUnowned: vi.fn(),
    setSinkUnownedToBottom: vi.fn(),
    setAllowDupes: vi.fn(),
    setPromoteRecommendedGear: vi.fn(),
    setPromoteMatchingWheelMainstats: vi.fn(),
  }

  return (
    <BuilderV2AwakenerPicker
      picker={picker}
      onAssignAwakener={onAssignAwakener}
      onAssignCovenant={vi.fn()}
      onAssignPosse={vi.fn()}
      onAssignWheel={onAssignWheel}
      onOpenAwakenerDetail={vi.fn()}
      onOpenCovenantDetail={vi.fn()}
      onOpenPosseDetail={vi.fn()}
      onOpenWheelDetail={vi.fn()}
    />
  )
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

  it('captures global typing into the active V2 picker search', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const searchInput = screen.getByRole('searchbox', {name: /search awakeners/i})
    expect(searchInput).not.toHaveFocus()

    fireEvent.keyDown(window, {key: 'r'})
    fireEvent.keyDown(window, {key: 'a'})
    fireEvent.keyDown(window, {key: 'm'})

    expect(searchInput).toHaveValue('ram')
    expect(searchInput).toHaveFocus()

    searchInput.blur()
    fireEvent.keyDown(window, {key: 'Backspace'})

    expect(searchInput).toHaveValue('ra')
    expect(searchInput).toHaveFocus()
  })

  it('windows picker results while allowing a lower wheel result to appear after search narrows', async () => {
    render(<WindowedPickerHarness tab='wheels' />)

    const panel = screen.getByRole('tabpanel', {name: /^wheels$/i})
    setPickerResultPanelLayout(panel)

    expect(screen.queryByRole('button', {name: /^deep wheel,/i})).not.toBeInTheDocument()

    const searchInput = screen.getByRole('searchbox', {name: /search wheels/i})
    fireEvent.change(searchInput, {target: {value: 'deep'}})

    expect(await screen.findByRole('button', {name: /^deep wheel,/i})).toBeInTheDocument()
    expect(panel.scrollTop).toBe(0)
  })

  it('windows picker results while allowing a lower awakener result to appear after scrolling', async () => {
    render(<WindowedPickerHarness tab='awakeners' />)

    const panel = screen.getByRole('tabpanel', {name: /^awakeners$/i})
    setPickerResultPanelLayout(panel)

    expect(
      screen.queryByRole('button', {name: /deep awakener, level \d+/i}),
    ).not.toBeInTheDocument()

    await act(async () => {
      await Promise.resolve()
    })
    panel.scrollTop = 1680
    fireEvent.scroll(panel)

    expect(
      await screen.findByRole('button', {name: /deep awakener, level \d+/i}),
    ).toBeInTheDocument()
  })

  it('assigns a visible windowed awakener result', () => {
    const assignAwakener = vi.fn()
    render(<WindowedPickerHarness onAssignAwakener={assignAwakener} tab='awakeners' />)

    const panel = screen.getByRole('tabpanel', {name: /^awakeners$/i})
    setPickerResultPanelLayout(panel)

    fireEvent.click(screen.getByRole('button', {name: /test awakener 1, level \d+/i}))

    expect(assignAwakener).toHaveBeenCalledWith('test-awakener-01')
  })

  it('renders picker no-result states inside the windowed result panel', () => {
    render(<WindowedPickerHarness tab='awakeners' />)

    fireEvent.change(screen.getByRole('searchbox', {name: /search awakeners/i}), {
      target: {value: 'not-a-real-awakener'},
    })

    expect(screen.getByText(/^no results$/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {name: /test awakener 1, level \d+/i}),
    ).not.toBeInTheDocument()
  })

  it('does not capture global picker typing while a dialog is open', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const searchInput = screen.getByRole('searchbox', {name: /search awakeners/i})
    const dialog = document.createElement('dialog')
    dialog.setAttribute('open', '')
    document.body.append(dialog)

    fireEvent.keyDown(window, {key: 'r'})

    expect(searchInput).toHaveValue('')
    expect(searchInput).not.toHaveFocus()

    dialog.remove()
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
    expect(clearSlot).toHaveTextContent(/^clear$/i)

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
      within(management).getByRole('listitem', {
        name: /goliath, chaos, level 90, support, covenant equipped: .+, 1 wheel equipped: .+/i,
      }),
    ).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /select team 2/i}))

    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
  })

  it('uses desktop team management previews as edit shortcuts', () => {
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots, posseId: 'posse-0033'},
        ],
      })
    })

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(management).getByRole('button', {name: /edit team 2 slot 1/i}))

    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()

    fireEvent.click(within(management).getByRole('button', {name: /edit team 2 posse/i}))

    expect(screen.getByText(/editing team 2 - posse/i)).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^posses$/i})).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the adaptive picker from team management previews', () => {
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(management).getByRole('button', {name: /edit team 2 slot 1/i}))

    const dock = screen.getByRole('region', {name: /adaptive picker/i})
    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - awakener/i)).toBeInTheDocument()
    expect(screen.getByRole('button', {name: /collapse adaptive picker/i})).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    expect(within(dock).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
  })

  it('opens the mobile picker from team management previews for any team', () => {
    const teamTwoSlots = createEmptyTeamSlots()
    teamTwoSlots[0] = {
      ...teamTwoSlots[0],
      awakenerId: 'awakener-0021',
      realm: 'CHAOS',
      level: 60,
    }
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: teamTwoSlots},
        ],
      })
    })

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(management).getByRole('button', {name: /edit team 2 slot 1/i}))

    const drawer = screen.getByRole('dialog', {name: /team 2 · slot 1 · awakener/i})
    expect(screen.getByRole('heading', {level: 2, name: /^team 2$/i})).toBeInTheDocument()
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('button', {name: /^select slot 1 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )
  })

  it('renames teams from the V2 management surface with Enter, Escape, blur, and blank no-op', () => {
    resizeBuilderV2Viewport(1200)
    render(<BuilderV2Page />)

    const management = screen.getByRole('region', {name: /builder v2 team management/i})
    fireEvent.click(within(management).getByRole('button', {name: /rename team 1/i}))
    const renameInput = within(management).getByRole('textbox', {name: /team name/i})
    expect(renameInput).toHaveFocus()
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

  it('shows team drag handles only when desktop-style DnD is available', () => {
    mockBuilderV2TouchDevice(false)
    resizeBuilderV2Viewport(1200)
    const {unmount} = render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: createEmptyTeamSlots()},
        ],
      })
    })

    expect(screen.getByRole('button', {name: /drag team 1 to reorder/i})).toBeInTheDocument()

    unmount()
    mockBuilderV2TouchDevice(true)
    resizeBuilderV2Viewport(900)
    render(<BuilderV2Page />)
    act(() => {
      builderDraftStore.getState().hydrateBuilderDraft({
        activeTeamId: 'team-1',
        teams: [
          {id: 'team-1', name: 'Team 1', slots: createEmptyTeamSlots()},
          {id: 'team-2', name: 'Team 2', slots: createEmptyTeamSlots()},
        ],
      })
    })

    expect(screen.queryByRole('button', {name: /drag team 1 to reorder/i})).not.toBeInTheDocument()
  })

  it('highlights only the effective team-management covenant target during drag feedback', () => {
    const {covenantButton, slotSummary, wheelButtons} = renderTeamManagementFeedbackTarget({
      kind: 'team-management-covenant',
      teamId: 'team-feedback',
      slotId: 'slot-1',
    })

    expect(covenantButton).toHaveClass('builder-v2-team-management-slot-covenant--drop-target')
    expect(slotSummary).not.toHaveClass('builder-v2-team-management-slot--drop-target')
    for (const wheelButton of wheelButtons) {
      expect(wheelButton).not.toHaveClass('builder-v2-team-management-loadout-cell--drop-target')
    }
  })

  it('highlights only the matching team-management wheel target during drag feedback', () => {
    const {covenantButton, slotSummary, wheelButtons} = renderTeamManagementFeedbackTarget({
      kind: 'team-management-wheel',
      teamId: 'team-feedback',
      slotId: 'slot-1',
      wheelIndex: 1,
    })

    expect(wheelButtons[0]).not.toHaveClass('builder-v2-team-management-loadout-cell--drop-target')
    expect(wheelButtons[1]).toHaveClass('builder-v2-team-management-loadout-cell--drop-target')
    expect(covenantButton).not.toHaveClass('builder-v2-team-management-slot-covenant--drop-target')
    expect(slotSummary).not.toHaveClass('builder-v2-team-management-slot--drop-target')
  })

  it('highlights only the broad team-management slot target during drag feedback', () => {
    const {covenantButton, slotSummary, wheelButtons} = renderTeamManagementFeedbackTarget({
      kind: 'team-management-slot',
      teamId: 'team-feedback',
      slotId: 'slot-1',
    })

    expect(slotSummary).toHaveClass('builder-v2-team-management-slot--drop-target')
    expect(covenantButton).not.toHaveClass('builder-v2-team-management-slot-covenant--drop-target')
    for (const wheelButton of wheelButtons) {
      expect(wheelButton).not.toHaveClass('builder-v2-team-management-loadout-cell--drop-target')
    }
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

  it('opens an adaptive picker dock from slot selection without search autofocus', () => {
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
    expect(within(dock).getByRole('searchbox', {name: /search awakeners/i})).not.toHaveFocus()

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
    expect(secondSlotTrigger).toHaveFocus()
    expect(
      within(screen.getByRole('region', {name: /adaptive picker/i})).getByRole('searchbox', {
        name: /search awakeners/i,
      }),
    ).not.toHaveFocus()

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
    expect(within(dock).getByRole('searchbox', {name: /search wheels/i})).not.toHaveFocus()
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
    expect(within(dock).getByRole('searchbox', {name: /search awakeners/i})).not.toHaveFocus()
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
    let importDialog = screen.getByRole('dialog', {name: /import teams/i})
    expect(importDialog).toBeInTheDocument()
    fireEvent(importDialog, new Event('cancel', {bubbles: false, cancelable: true}))
    expect(screen.queryByRole('dialog', {name: /import teams/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.click(importDialog)
    expect(screen.queryByRole('dialog', {name: /import teams/i})).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /^import$/i}))
    importDialog = screen.getByRole('dialog', {name: /import teams/i})
    fireEvent.click(screen.getByRole('button', {name: /^cancel$/i}))
    expect(importDialog).not.toBeInTheDocument()

    unmount()
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    expect(
      screen.getByRole('group', {name: /builder v2 import and export actions/i}),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: /^export all$/i}))
    const exportDialog = screen.getByRole('dialog', {name: /export all teams/i})
    expect(exportDialog).toBeInTheDocument()
    fireEvent(exportDialog, new Event('cancel', {bubbles: false, cancelable: true}))
    expect(screen.queryByRole('dialog', {name: /export all teams/i})).not.toBeInTheDocument()
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
    expect(drawer.tagName).toBe('DIALOG')
    expect(drawer).toHaveAttribute('open')
    expect(within(drawer).getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
    expect(within(drawer).getByRole('button', {name: /close mobile picker/i})).toHaveFocus()
    expect(within(drawer).getByRole('searchbox', {name: /search awakeners/i})).not.toHaveFocus()
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

    expect(document.querySelector('.builder-v2-mobile-picker-backdrop')).toBeInTheDocument()
    await waitFor(() => {
      expect(document.querySelector('.builder-v2-mobile-picker-backdrop')).toHaveAttribute('inert')
    })
  })

  it('opens the mobile picker drawer on a wheel target with the wheels tab active', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    let drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /goliath, level \d+/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    expect(screen.getByRole('button', {name: /remove goliath/i})).toBeInTheDocument()
    expect(
      within(drawer).getByRole('region', {name: /mobile slot picker controls/i}),
    ).toBeInTheDocument()

    fireEvent.click(within(drawer).getByRole('button', {name: /^select slot 1 wheel 2$/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · wheel 2/i})
    expect(within(drawer).getByRole('tab', {name: /^wheels$/i})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(drawer).getByRole('searchbox', {name: /search wheels/i})).toBeInTheDocument()
    expect(screen.getByText(/editing slot 1 - wheel 2/i)).toBeInTheDocument()

    fireEvent.click(within(drawer).getByRole('button', {name: /^close$/i}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
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

  it('closes the mobile picker drawer from the native backdrop but keeps panel clicks inside', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const pickerTrigger = screen.getByRole('button', {name: /^select slot 3$/i})
    fireEvent.click(pickerTrigger)

    const drawer = screen.getByRole('dialog', {name: /team 1 · slot 3 · awakener/i})
    const panel = drawer.querySelector('.builder-v2-mobile-picker')
    expect(panel).toBeInTheDocument()

    fireEvent.click(panel as HTMLElement)
    expect(screen.getByRole('dialog', {name: /team 1 · slot 3 · awakener/i})).toBeInTheDocument()

    fireEvent.click(drawer)

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
    expect(
      within(screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})).getByRole(
        'button',
        {name: /^select slot 2 wheel 1$/i},
      ),
    ).toBeInTheDocument()
  })

  it('retargets mobile slot picker back to the awakener before replacing from a wheel target', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    let drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /goliath, level \d+/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /^select slot 1 wheel 1$/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · wheel 1/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /^merciful nurturing,/i}))
    fireEvent.click(within(drawer).getByRole('button', {name: /^select slot 1 awakener$/i}))

    drawer = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(drawer).getByRole('button', {name: /ramona, level \d+/i}))

    expect(screen.getByRole('button', {name: /remove ramona/i})).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /remove goliath/i})).not.toBeInTheDocument()
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
      within(lineup).getByRole('list', {name: /quick lineup team overview/i}),
    ).toBeInTheDocument()
    expect(screen.queryByRole('region', {name: /mobile focused builder/i})).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      within(lineup).queryByRole('navigation', {name: /quick lineup steps/i}),
    ).not.toBeInTheDocument()

    const overview = within(lineup).getByRole('list', {
      name: /quick lineup team overview/i,
    })
    expect(within(overview).getAllByRole('button', {name: /^select slot \d$/i})).toHaveLength(4)
    expect(
      within(lineup).queryByRole('heading', {name: /slot 1 · awakener/i}),
    ).not.toBeInTheDocument()
    expect(
      within(lineup).queryByRole('tablist', {name: /picker categories/i}),
    ).not.toBeInTheDocument()
    expect(within(lineup).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
    expect(within(lineup).getByRole('button', {name: /^select slot 1 awakener$/i})).toHaveAttribute(
      'aria-current',
      'step',
    )

    fireEvent.click(within(lineup).getByRole('button', {name: /goliath, level \d+/i}))

    expect(within(lineup).getByText(/step 2 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 1 · wheel 1/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('searchbox', {name: /search wheels/i})).toBeInTheDocument()
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
    expect(within(lineup).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
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
    const overview = within(lineup).getByRole('list', {
      name: /quick lineup team overview/i,
    })
    const overviewSlots = within(overview).getAllByRole('listitem', {
      name: /slot \d quick overview/i,
    })

    expect(overview).toHaveClass('builder-v2-mobile-lineup-overview')
    expect(overviewSlots).toHaveLength(4)
    expect(
      within(overviewSlots[0]).getByRole('button', {name: /^select slot 1$/i}),
    ).toBeInTheDocument()
    expect(within(overviewSlots[0]).queryByText(/^slot 1$/i)).not.toBeInTheDocument()
    expect(
      within(overviewSlots[0]).queryByRole('button', {
        name: /^select slot 1 awakener before wheel 1$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(overviewSlots[0]).queryByRole('button', {
        name: /^select slot 1 awakener before wheel 2$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(overviewSlots[0]).queryByRole('button', {
        name: /^select slot 1 awakener before covenant$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      overviewSlots[0].querySelectorAll('.builder-v2-mobile-lineup-gear-button--inert'),
    ).toHaveLength(3)
  })

  it('keeps empty mobile quick lineup gear cells decorative while the slot card selects awakener', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const overview = within(lineup).getByRole('list', {
      name: /quick lineup team overview/i,
    })
    const overviewSlots = within(overview).getAllByRole('listitem', {
      name: /slot \d quick overview/i,
    })
    expect(
      within(overviewSlots[1]).queryByRole('button', {
        name: /^select slot 2 awakener before wheel 1$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      within(overviewSlots[1]).queryByRole('button', {
        name: /^select slot 2 awakener before covenant$/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      overviewSlots[1].querySelectorAll('.builder-v2-mobile-lineup-gear-button--inert'),
    ).toHaveLength(3)

    fireEvent.click(
      within(overviewSlots[1]).getByRole('button', {
        name: /^select slot 2$/i,
      }),
    )

    expect(within(lineup).getByText(/step 5 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 2 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()

    fireEvent.click(
      within(overviewSlots[2]).getByRole('button', {
        name: /^select slot 3$/i,
      }),
    )

    expect(within(lineup).getByText(/step 9 \/ 17/i)).toBeInTheDocument()
    expect(within(lineup).getByText(/slot 3 · awakener/i)).toBeInTheDocument()
    expect(within(lineup).getByRole('searchbox', {name: /search awakeners/i})).toBeInTheDocument()
  })

  it('opens the awakener picker when an empty mobile gear slot is tapped', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 2 wheel 1$/i}))

    expect(screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^awakeners$/i})).toHaveAttribute('aria-selected', 'true')
  })

  it('opens the wheel picker when a filled mobile slot wheel target is tapped', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /^select slot 1$/i}))
    const awakenerPicker = screen.getByRole('dialog', {name: /team 1 · slot 1 · awakener/i})
    fireEvent.click(within(awakenerPicker).getByRole('button', {name: /goliath, level \d+/i}))

    const activeSlots = screen.getByLabelText(/builder v2 active team slots/i)
    const slot1 = within(activeSlots).getByText('Slot 1').closest('article')
    if (!slot1) {
      throw new Error('Expected slot 1 article to render')
    }
    fireEvent.click(within(slot1).getByRole('button', {name: /^select slot 1 wheel 1$/i}))

    expect(screen.getByRole('dialog', {name: /team 1 · slot 1 · wheel 1/i})).toBeInTheDocument()
    expect(screen.getByRole('tab', {name: /^wheels$/i})).toHaveAttribute('aria-selected', 'true')
  })

  it('restores focus to the mobile picker trigger after Escape closes the dialog', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    const trigger = screen.getByRole('button', {name: /^select slot 2 wheel 1$/i})
    fireEvent.click(trigger)

    expect(screen.getByRole('dialog', {name: /team 1 · slot 2 · awakener/i})).toBeInTheDocument()

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(
      screen.queryByRole('dialog', {name: /team 1 · slot 2 · awakener/i}),
    ).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('places mobile quick lineup picker filters near search without category tabs', () => {
    resizeBuilderV2Viewport(390)
    render(<BuilderV2Page />)

    fireEvent.click(screen.getByRole('button', {name: /quick team lineup/i}))

    const lineup = screen.getByRole('region', {name: /mobile quick team lineup/i})
    const picker = within(lineup).getByRole('region', {name: /slot 1 · awakener/i})
    const toolbar = picker.querySelector('.builder-v2-picker-toolbar')
    const filters = picker.querySelector('.builder-v2-picker-filter-stack')
    const results = within(picker).getByRole('region', {name: /awakeners results/i})
    const bottomControls = picker.querySelector('.builder-v2-picker-bottom-controls')

    expect(toolbar).not.toBeNull()
    expect(filters).not.toBeNull()
    expect(results).not.toBeNull()
    expect(bottomControls).toBeNull()
    expect(
      within(picker).queryByRole('tablist', {name: /picker categories/i}),
    ).not.toBeInTheDocument()
    if (!toolbar || !filters) {
      throw new Error('Expected quick lineup picker controls and results')
    }
    expect(
      Boolean(toolbar.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
    expect(
      Boolean(filters.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING),
    ).toBe(true)
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

  it('is reachable through /builder-v2 from the compact nav chip', async () => {
    render(
      <MemoryRouter initialEntries={['/builder-v2']}>
        <App />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', {level: 1, name: /builder v2/i})).toBeInTheDocument()
    const desktopNav = screen.getByRole('navigation', {name: /primary navigation desktop/i})
    expect(within(desktopNav).getByRole('link', {name: /^builder$/i})).toHaveAttribute(
      'href',
      '/builder',
    )
    expect(within(desktopNav).getByRole('link', {name: /builder v2 beta/i})).toHaveAttribute(
      'href',
      '/builder-v2',
    )
  })
})
