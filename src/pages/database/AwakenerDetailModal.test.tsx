import {useState} from 'react'

import {fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {z} from 'zod'

import {resolveAwakenerStatsForLevel} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullV2Record} from '@/domain/awakeners-full-v2'

import {AwakenerDetailModal} from './AwakenerDetailModal'
import {
  makeDatabaseShellView,
  makeTestAwakener,
  makeTestAwakenerFullV2Record,
  makeTestFullStats,
} from './database-test-fixtures'

const mockCloseAllPopovers = vi.fn()
const mockGetAwakenerCardAsset = vi.fn((_name: string): string | undefined => '/card.webp')
let mockHasOpenPopovers = false

vi.mock('./useDatabasePopoverController', () => ({
  useDatabasePopoverController: () => ({
    hasOpenPopovers: mockHasOpenPopovers,
    closeAllPopovers: mockCloseAllPopovers,
    contextValue: {
      openRootReferenceByName: vi.fn(),
      openRootOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openNestedOverlay: vi.fn(),
      hasOpenPopovers: mockHasOpenPopovers,
      closeAllPopovers: mockCloseAllPopovers,
    },
    popoverRootProps: {
      anchorRect: null,
      enlightens: [],
      entries: [],
      onCloseAll: vi.fn(),
      referenceLayer: null,
      stats: null,
      talents: [],
    },
  }),
}))

vi.mock('../../domain/awakeners', () => ({
  getAwakeners: () => [
    {
      id: 1,
      name: 'thais',
      realm: 'AEQUOR',
      faction: 'Test',
      type: 'ASSAULT',
      rarity: 'SSR',
      aliases: ['thais'],
      tags: [],
    },
    {
      id: 2,
      name: 'beta',
      realm: 'CHAOS',
      faction: 'Test',
      type: 'ASSAULT',
      rarity: 'SSR',
      aliases: ['beta'],
      tags: [],
    },
  ],
}))

vi.mock('../../domain/derived-skills', () => ({
  getDerivedSkills: () => [],
}))

vi.mock('../../domain/awakener-database-state', () => ({
  selectedEnlightenSlotSchema: z.enum(['E1', 'E2', 'E3', 'AbsoluteAxiom']).nullable(),
  normalizeAwakenerDatabaseSelection: ({
    awakenerLevel = 60,
    psycheSurgeOffset = 0,
    skillLevel = 1,
    selectedEnlightenSlot = null,
    soulforgeLevel = 0,
  }: {
    awakenerLevel?: number
    psycheSurgeOffset?: number
    skillLevel?: number
    selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
    soulforgeLevel?: number
  } = {}) => ({
    awakenerLevel: Math.min(90, Math.max(1, awakenerLevel)),
    psycheSurgeOffset: Math.min(12, Math.max(0, psycheSurgeOffset)),
    skillLevel: Math.min(6, Math.max(1, skillLevel)),
    selectedEnlightenSlot,
    soulforgeLevel: Math.max(0, soulforgeLevel),
  }),
  normalizeAwakenerDatabaseSelectionForRecord: (
    _fullDataV2: Parameters<typeof resolveAwakenerStatsForLevel>[0],
    selection: {
      awakenerLevel?: number
      psycheSurgeOffset?: number
      skillLevel?: number
      selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
      soulforgeLevel?: number
    } = {},
  ) => ({
    awakenerLevel: Math.min(90, Math.max(1, selection.awakenerLevel ?? 60)),
    psycheSurgeOffset: Math.min(12, Math.max(0, selection.psycheSurgeOffset ?? 0)),
    skillLevel: Math.min(6, Math.max(1, selection.skillLevel ?? 1)),
    selectedEnlightenSlot:
      selection.selectedEnlightenSlot === 'AbsoluteAxiom'
        ? 'E3'
        : (selection.selectedEnlightenSlot ?? null),
    soulforgeLevel: Math.min(3, Math.max(0, selection.soulforgeLevel ?? 0)),
  }),
  getDefaultAwakenerDatabaseSelection: () => ({
    awakenerLevel: 60,
    psycheSurgeOffset: 0,
    skillLevel: 1,
    selectedEnlightenSlot: null,
    soulforgeLevel: 0,
  }),
  patchAwakenerDatabaseSelection: (
    _fullDataV2: Parameters<typeof resolveAwakenerStatsForLevel>[0],
    previousSelection: {
      awakenerLevel?: number
      psycheSurgeOffset?: number
      skillLevel?: number
      selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
      soulforgeLevel?: number
    },
    nextPartial: {
      awakenerLevel?: number
      psycheSurgeOffset?: number
      skillLevel?: number
      selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
      soulforgeLevel?: number
    },
  ) => ({
    awakenerLevel: 60,
    psycheSurgeOffset: 0,
    skillLevel: 1,
    selectedEnlightenSlot: null,
    soulforgeLevel: 0,
    ...previousSelection,
    ...nextPartial,
  }),
  resolveAwakenerDatabaseState: (
    fullDataV2: Parameters<typeof resolveAwakenerStatsForLevel>[0],
    {
      awakenerLevel = 60,
      psycheSurgeOffset = 0,
      skillLevel = 1,
      selectedEnlightenSlot = null,
      soulforgeLevel = 0,
    }: {
      awakenerLevel?: number
      psycheSurgeOffset?: number
      skillLevel?: number
      selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
      soulforgeLevel?: number
    },
  ) => ({
    selection: {
      awakenerLevel,
      psycheSurgeOffset,
      skillLevel,
      selectedEnlightenSlot,
      soulforgeLevel,
    },
    controls: {
      enlightenOptions: [
        {value: null, label: 'E0'},
        {value: 'E1', label: 'E1'},
        {value: 'E2', label: 'E2'},
        {value: 'E3', label: 'E3'},
      ],
      canAdjustPsycheSurge: true,
      psycheSurgeOffsetMin: 0,
      psycheSurgeOffsetMax: 12,
      hasSoulforgeTalent: true,
      skillLevelMin: 1,
      skillLevelMax: 6,
      soulforgeLevelMin: 0,
      soulforgeLevelMax: 3,
    },
    stats: resolveAwakenerStatsForLevel(fullDataV2, awakenerLevel, psycheSurgeOffset),
    shellView: makeDatabaseShellView({
      stats: resolveAwakenerStatsForLevel(fullDataV2, awakenerLevel, psycheSurgeOffset),
      selection: {
        selectedEnlightenSlot,
        soulforgeLevel,
      },
      skillLevel,
    }),
    referenceLayer: {
      cardNames: new Set<string>(),
      accessibleOverlays: [],
      referenceInfoByName: new Map(),
      referenceInfoById: new Map(),
      overlayByName: new Map(),
    },
  }),
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: (name: string) => mockGetAwakenerCardAsset(name),
  getAwakenerPortraitAsset: () => '/portrait.webp',
}))

vi.mock('../../domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('../../domain/factions', () => ({
  getRealmIcon: () => null,
  getRealmLabel: (realm: string) => realm,
  getRealmTint: () => '#ffffff',
}))

vi.mock('./AwakenerDetailSidebar', () => ({
  AwakenerDetailSidebar: ({
    onOpenFullArt,
    onPatchSelection,
    selection,
    stats,
  }: {
    onOpenFullArt?: () => void
    onPatchSelection: (nextPartial: {
      awakenerLevel?: number
      psycheSurgeOffset?: number
      selectedEnlightenSlot?: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
    }) => void
    selection: {
      awakenerLevel: number
      psycheSurgeOffset: number
      selectedEnlightenSlot: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null
    }
    stats: {CON: string; CritRate: string} | null
  }) => (
    <div>
      {onOpenFullArt ? (
        <button onClick={onOpenFullArt} type='button'>
          Open sidebar art
        </button>
      ) : null}
      <button
        onClick={() => {
          onPatchSelection({awakenerLevel: 90})
        }}
        type='button'
      >
        Set level 90
      </button>
      <button
        onClick={() => {
          onPatchSelection({psycheSurgeOffset: selection.psycheSurgeOffset + 1})
        }}
        type='button'
      >
        Increase Psyche Surge
      </button>
      <button
        onClick={() => {
          onPatchSelection({selectedEnlightenSlot: 'E2'})
        }}
        type='button'
      >
        Set E2
      </button>
      <div>Sidebar Level {selection.awakenerLevel}</div>
      <div>Sidebar E3+{selection.psycheSurgeOffset}</div>
      <div>Sidebar Enlighten {selection.selectedEnlightenSlot ?? 'E0'}</div>
      <div>Sidebar CON {stats?.CON ?? 'none'}</div>
      <div>Sidebar Crit Rate {stats?.CritRate ?? 'none'}</div>
    </div>
  ),
}))

vi.mock('./AwakenerDetailOverview', () => ({
  AwakenerDetailOverview: ({
    shellView,
  }: {
    shellView: {
      stats: {CON: string; CritRate: string} | null
      selection: {selectedEnlightenSlot: 'E1' | 'E2' | 'E3' | 'AbsoluteAxiom' | null}
    } | null
  }) => (
    <div>
      <div>Overview CON {shellView?.stats?.CON ?? 'none'}</div>
      <div>Overview Crit Rate {shellView?.stats?.CritRate ?? 'none'}</div>
      <div>Overview Enlighten {shellView?.selection.selectedEnlightenSlot ?? 'E0'}</div>
    </div>
  ),
}))

vi.mock('./AwakenerDetailCards', () => ({
  AwakenerDetailCards: () => <div>Cards Tab</div>,
}))

vi.mock('./AwakenerBuildsTab', () => ({
  AwakenerBuildsTab: ({awakenerId}: {awakenerId: number}) => <div>Builds Tab {awakenerId}</div>,
}))

vi.mock('./AwakenerTeamsTab', () => ({
  AwakenerTeamsTab: () => <div>Teams Tab</div>,
}))

const TEST_AWAKENERS_FULL_V2 = [
  makeTestAwakenerFullV2Record({
    id: 1,
    displayName: 'thais',
    stats: makeTestFullStats({
      CON: '140',
      ATK: '135',
      DEF: '126',
      CritRate: '14.6%',
    }),
    primaryScalingBase: 30,
    statScaling: {
      CON: 1.55,
      ATK: 1.5,
      DEF: 1.4,
    },
    substatScaling: {
      CritRate: '1.6%',
    },
  }),
  makeTestAwakenerFullV2Record({
    id: 2,
    displayName: 'beta',
    stats: makeTestFullStats({
      CON: '149',
      ATK: '204',
      DEF: '160',
      CritRate: '5%',
    }),
    primaryScalingBase: 30,
    statScaling: {
      CON: 1.35,
      ATK: 1.85,
      DEF: 1.45,
    },
    substatScaling: {},
  }),
] as AwakenerFullV2Record[]

function makeAwakener(id: number, name: string): Awakener {
  return makeTestAwakener({id, name})
}

interface TestAwakenerDetailModalOptions {
  activeTab?: 'overview' | 'cards' | 'builds' | 'teams'
  awakeners?: Awakener[]
  key?: number
  onClose?: () => void
  onSelectAwakener?: (awakener: Awakener, tab: 'overview' | 'cards' | 'builds' | 'teams') => void
  onTabChange?: (tab: 'overview' | 'cards' | 'builds' | 'teams') => void
}

function getTestFullDataV2(id: number): AwakenerFullV2Record {
  const fullDataV2 = TEST_AWAKENERS_FULL_V2.find((entry) => entry.id === id)
  if (!fullDataV2) {
    throw new Error(`Missing test full V2 data for awakener ${String(id)}`)
  }
  return fullDataV2
}

function createAwakenerDetailModalElement(
  awakener: Awakener,
  {
    activeTab = 'overview',
    awakeners = [makeAwakener(1, 'thais'), makeAwakener(2, 'beta')],
    key,
    onClose = vi.fn(),
    onSelectAwakener,
    onTabChange,
  }: TestAwakenerDetailModalOptions = {},
) {
  function ControlledHarness() {
    const [currentTab, setCurrentTab] = useState(activeTab)

    return (
      <AwakenerDetailModal
        activeTab={currentTab}
        awakener={awakener}
        awakeners={awakeners}
        fullDataV2={getTestFullDataV2(awakener.id)}
        key={key}
        onClose={onClose}
        onSelectAwakener={onSelectAwakener}
        onTabChange={(nextTab) => {
          setCurrentTab(nextTab)
          onTabChange?.(nextTab)
        }}
      />
    )
  }

  return <ControlledHarness key={key} />
}

function renderAwakenerDetailModal(
  awakener: Awakener,
  options: TestAwakenerDetailModalOptions = {},
) {
  return render(createAwakenerDetailModalElement(awakener, options))
}

function getModalFocusableElements(dialog: HTMLElement) {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

function getDetailShell(): HTMLElement {
  const shell = document.querySelector<HTMLElement>('[data-detail-modal-shell]')
  if (!shell) {
    throw new Error('Expected detail modal shell to be rendered')
  }
  return shell
}

describe('AwakenerDetailModal', () => {
  beforeEach(() => {
    mockHasOpenPopovers = false
    mockGetAwakenerCardAsset.mockReset()
    mockGetAwakenerCardAsset.mockReturnValue('/card.webp')
    mockCloseAllPopovers.mockReset()
    window.localStorage.clear()
  })

  it('resets active tab to overview when switching awakeners', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'alpha')
    const second = makeAwakener(2, 'beta')

    const {rerender} = renderAwakenerDetailModal(first, {key: first.id, onClose})

    fireEvent.click(screen.getByRole('tab', {name: 'Cards'}))
    expect(screen.getByRole('tab', {name: 'Cards'})).toHaveAttribute('aria-selected', 'true')

    rerender(createAwakenerDetailModalElement(second, {key: second.id, onClose}))

    await waitFor(() => {
      expect(screen.getByRole('tab', {name: 'Overview'})).toHaveAttribute('aria-selected', 'true')
    })
  })

  it('exposes semantic tabs and tabpanel linkage', () => {
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener)

    const dialog = screen.getByRole('dialog', {name: /thais details/i})
    const searchInput = screen.getByRole('combobox', {name: /jump to awakener/i})

    expect(searchInput).toBeInTheDocument()
    expect(dialog).not.toContainElement(searchInput)
    expect(
      within(dialog).getByRole('tablist', {name: 'Awakener detail sections'}),
    ).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', {name: 'Overview'})).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(within(dialog).getByRole('tab', {name: 'Overview'})).toHaveAttribute('tabindex', '0')
    expect(within(dialog).getByRole('tab', {name: 'Cards'})).toHaveAttribute(
      'aria-selected',
      'false',
    )
    expect(within(dialog).getByRole('tab', {name: 'Cards'})).toHaveAttribute('tabindex', '-1')

    const panel = within(dialog).getByRole('tabpanel')
    expect(panel).toHaveAttribute(
      'aria-labelledby',
      within(dialog).getByRole('tab', {name: 'Overview'}).getAttribute('id'),
    )
    expect(within(dialog).getByRole('tab', {name: 'Overview'})).toHaveAttribute(
      'aria-controls',
      panel.getAttribute('id'),
    )
  })

  it('supports keyboard navigation across the semantic tablist', () => {
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener)

    const overviewTab = screen.getByRole('tab', {name: 'Overview'})
    overviewTab.focus()

    fireEvent.keyDown(overviewTab, {key: 'ArrowRight'})
    expect(screen.getByRole('tab', {name: 'Cards'})).toHaveFocus()
    expect(screen.getByRole('tab', {name: 'Cards'})).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', {name: 'Cards'}).getAttribute('id'),
    )

    fireEvent.keyDown(screen.getByRole('tab', {name: 'Cards'}), {key: 'End'})
    expect(screen.getByRole('tab', {name: 'Teams'})).toHaveFocus()
    expect(screen.getByRole('tab', {name: 'Teams'})).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(screen.getByRole('tab', {name: 'Teams'}), {key: 'Home'})
    expect(screen.getByRole('tab', {name: 'Overview'})).toHaveFocus()
    expect(screen.getByRole('tab', {name: 'Overview'})).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(screen.getByRole('tab', {name: 'Overview'}), {key: 'ArrowLeft'})
    expect(screen.getByRole('tab', {name: 'Teams'})).toHaveFocus()
    expect(screen.getByRole('tab', {name: 'Teams'})).toHaveAttribute('aria-selected', 'true')
  })

  it('places focus inside the dialog on open, traps tabbing, and restores focus on close', async () => {
    const openerAwakener = makeAwakener(1, 'thais')
    const onTabChange = vi.fn()

    function FocusHarness() {
      const [isOpen, setIsOpen] = useState(false)

      return (
        <div>
          <button
            onClick={() => {
              setIsOpen(true)
            }}
            type='button'
          >
            Open modal
          </button>
          {isOpen ? (
            <AwakenerDetailModal
              activeTab='overview'
              awakener={openerAwakener}
              awakeners={[makeAwakener(1, 'thais'), makeAwakener(2, 'beta')]}
              fullDataV2={getTestFullDataV2(openerAwakener.id)}
              onClose={() => {
                setIsOpen(false)
              }}
              onTabChange={onTabChange}
            />
          ) : null}
        </div>
      )
    }

    render(<FocusHarness />)

    const opener = screen.getByRole('button', {name: 'Open modal'})
    opener.focus()
    fireEvent.click(opener)

    const dialog = await screen.findByRole('dialog', {name: /thais details/i})

    const detailShell = getDetailShell()
    const focusableElements = getModalFocusableElements(detailShell)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    firstElement.focus()
    fireEvent.keyDown(firstElement, {key: 'Tab', shiftKey: true})
    expect(lastElement).toHaveFocus()

    lastElement.focus()
    fireEvent.keyDown(lastElement, {key: 'Tab'})
    expect(firstElement).toHaveFocus()

    fireEvent.click(within(dialog).getByRole('button', {name: 'Close detail'}))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(opener).toHaveFocus()
  })

  it('updates resolved awakener stats when the database level changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Level 60')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar CON 140')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Overview CON 140')).toBeInTheDocument()
      expect(screen.getByText('Overview Crit Rate 14.6%')).toBeInTheDocument()
      expect(screen.getByText('Overview Enlighten E0')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set level 90'})[0])

    expect(screen.getAllByText('Sidebar Level 90')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar CON 186')).toHaveLength(2)
    expect(screen.getByText('Overview CON 186')).toBeInTheDocument()
  })

  it('updates resolved substats when the Psyche Surge offset changes', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar E3+0')).toHaveLength(2)
      expect(screen.getAllByText('Sidebar Crit Rate 14.6%')).toHaveLength(2)
      expect(screen.getByText('Overview Crit Rate 14.6%')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Increase Psyche Surge'})[0])

    expect(screen.getAllByText('Sidebar E3+1')).toHaveLength(2)
    expect(screen.getAllByText('Sidebar Crit Rate 16.2%')).toHaveLength(2)
    expect(screen.getByText('Overview Crit Rate 16.2%')).toBeInTheDocument()
  })

  it('updates the selected enlighten slot through shared selection state', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set E2'})[0])

    expect(screen.getAllByText('Sidebar Enlighten E2')).toHaveLength(2)
    expect(screen.getByText('Overview Enlighten E2')).toBeInTheDocument()
  })

  it('updates default progression for the next awakener without changing the current live state', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'thais')
    const second = makeAwakener(2, 'beta')

    const {rerender} = renderAwakenerDetailModal(first, {key: first.id, onClose})

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
      expect(screen.getByText('Overview Enlighten E0')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', {name: 'Open detail settings'}))

    const defaultProgressionButton = screen.getByRole('button', {name: /default progression/i})
    fireEvent.click(defaultProgressionButton)

    const defaultProgressionSection = screen
      .getByText('Applies when opening a different awakener next time.')
      .closest('div')
    if (!defaultProgressionSection) {
      throw new Error('Expected default progression section')
    }

    fireEvent.click(within(defaultProgressionSection).getByRole('button', {name: 'E2'}))

    expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
    expect(screen.getByText('Overview Enlighten E0')).toBeInTheDocument()
    expect(window.localStorage.getItem('database-detail-preferences')).toContain(
      '"selectedEnlightenSlot":"E2"',
    )

    rerender(createAwakenerDetailModalElement(second, {key: second.id, onClose}))

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Enlighten E2')).toHaveLength(2)
      expect(screen.getByText('Overview Enlighten E2')).toBeInTheDocument()
    })
  })

  it('resets live selection when switching awakeners without remounting the modal', async () => {
    const onClose = vi.fn()
    const first = makeAwakener(1, 'thais')
    const second = makeAwakener(2, 'beta')

    const {rerender} = renderAwakenerDetailModal(first, {onClose})

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
      expect(screen.getByText('Overview Enlighten E0')).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', {name: 'Set E2'})[0])

    expect(screen.getAllByText('Sidebar Enlighten E2')).toHaveLength(2)
    expect(screen.getByText('Overview Enlighten E2')).toBeInTheDocument()

    rerender(createAwakenerDetailModalElement(second, {onClose}))

    await waitFor(() => {
      expect(screen.getAllByText('Sidebar Enlighten E0')).toHaveLength(2)
      expect(screen.getByText('Overview Enlighten E0')).toBeInTheDocument()
    })
  })

  it('resets expanded tags when switching awakeners', async () => {
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollHeight',
    )
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 100
      },
    })

    const onClose = vi.fn()
    const first = makeAwakener(1, 'thais')
    const second = makeAwakener(2, 'beta')
    const firstWithTags = {
      ...first,
      tags: ['Bleed', 'Crit', 'Burn', 'Slow', 'Shield'],
    }
    const secondWithTags = {
      ...second,
      tags: ['Support', 'Heal', 'Haste', 'Dispel', 'Barrier'],
    }

    try {
      const {rerender} = renderAwakenerDetailModal(firstWithTags, {onClose})

      const toggle = await screen.findByRole('button', {name: 'Show all tags'})
      fireEvent.click(toggle)

      expect(screen.getByRole('button', {name: 'Show fewer tags'})).toBeInTheDocument()

      rerender(createAwakenerDetailModalElement(secondWithTags, {onClose}))

      await waitFor(() => {
        expect(screen.getByRole('button', {name: 'Show all tags'})).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', {name: 'Show fewer tags'})).not.toBeInTheDocument()
    } finally {
      if (originalScrollHeight) {
        Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
      } else {
        delete (HTMLElement.prototype as {scrollHeight?: number}).scrollHeight
      }
    }
  })

  it('passes the active awakener id to the builds tab', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    fireEvent.click(screen.getByRole('tab', {name: 'Builds'}))

    expect(await screen.findByText('Builds Tab 1')).toBeInTheDocument()
  })

  it('opens a searched awakener from the modal search and preserves the active tab', async () => {
    const onClose = vi.fn()
    const onSelectAwakener = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose, onSelectAwakener})

    fireEvent.click(screen.getByRole('tab', {name: 'Cards'}))
    const searchInput = screen.getByRole('combobox', {name: /jump to awakener/i})
    fireEvent.change(searchInput, {target: {value: 'be'}})
    fireEvent.keyDown(searchInput, {key: 'Enter'})

    expect(onSelectAwakener).toHaveBeenCalledWith(expect.objectContaining({id: 2}), 'cards')
  })

  it('captures global typing into the modal search and lets escape clear it without closing', async () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    const searchInput = screen.getByRole('combobox', {name: /jump to awakener/i})
    fireEvent.keyDown(window, {key: 'b'})

    expect(searchInput).toHaveValue('b')
    expect(searchInput).toHaveFocus()

    fireEvent.keyDown(window, {key: 'Escape'})

    expect(searchInput).toHaveValue('')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('routes backspace into the modal search when it already has text', () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    renderAwakenerDetailModal(awakener, {onClose})

    const searchInput = screen.getByRole('combobox', {name: /jump to awakener/i})
    fireEvent.keyDown(window, {key: 'b'})
    fireEvent.keyDown(window, {key: 'e'})

    expect(searchInput).toHaveValue('be')

    fireEvent.keyDown(window, {key: 'Backspace'})

    expect(searchInput).toHaveValue('b')
    expect(searchInput).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking outside closes the search dropdown before closing the modal', () => {
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    const {container} = renderAwakenerDetailModal(awakener, {onClose})

    const searchInput = screen.getByRole('combobox', {name: /jump to awakener/i})
    fireEvent.focus(searchInput)
    fireEvent.change(searchInput, {target: {value: 'a'}})

    expect(screen.getByRole('option', {name: /thais/i})).toBeInTheDocument()

    fireEvent.click(container.firstChild as HTMLElement)

    expect(screen.queryByRole('option', {name: /thais/i})).not.toBeInTheDocument()
    expect(searchInput).toHaveValue('a')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('clicking outside closes all popovers before closing the modal when enabled', () => {
    mockHasOpenPopovers = true
    const onClose = vi.fn()
    const awakener = makeAwakener(1, 'thais')

    const {container} = renderAwakenerDetailModal(awakener, {onClose})

    fireEvent.click(container.firstChild as HTMLElement)

    expect(mockCloseAllPopovers).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('opens the full card art from the mobile portrait trigger and closes it with Escape', () => {
    renderAwakenerDetailModal(makeAwakener(1, 'thais'))

    fireEvent.click(screen.getByRole('button', {name: /view full art for thais/i}))

    expect(screen.getByRole('dialog', {name: /thais full art/i})).toBeInTheDocument()
    expect(screen.getByRole('img', {name: /thais full art/i})).toHaveAttribute('src', '/card.webp')

    fireEvent.keyDown(window, {key: 'Escape'})

    expect(screen.queryByRole('dialog', {name: /thais full art/i})).not.toBeInTheDocument()
  })

  it('opens the full card art from the desktop sidebar trigger', () => {
    renderAwakenerDetailModal(makeAwakener(1, 'thais'))

    fireEvent.click(screen.getByRole('button', {name: 'Open sidebar art'}))

    expect(screen.getByRole('dialog', {name: /thais full art/i})).toBeInTheDocument()
  })
})
