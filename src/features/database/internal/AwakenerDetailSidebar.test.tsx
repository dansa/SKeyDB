import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {PopoverStoreContext} from './usePopoverStore'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => null,
  getColoredMainstatIcon: () => null,
  getMainstatAccentColor: () => '#ffffff',
  WHEEL_MAINSTAT_KEYS: [
    'ATK',
    'DEF',
    'CON',
    'CRIT_RATE',
    'CRIT_DMG',
    'REALM_MASTERY',
    'DMG_AMP',
    'ALIEMUS_REGEN',
    'KEYFLARE_REGEN',
    'SIGIL_YIELD',
    'DEATH_RESISTANCE',
  ],
}))

const TEST_AWAKENER: Awakener = {
  id: 'awakener-0001',
  name: 'thais',
  realm: 'AEQUOR',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['thais'],
  tags: [],
  lineupToken: 'a',
}

const TEST_STATS: FullStats = {
  CON: '140',
  ATK: '135',
  DEF: '126',
  CritRate: '14.6%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
}

const TEST_SUBSTAT_SCALING: SubstatScaling = {
  CritRate: '1.6%',
}

const TEST_CONTROLS: AwakenerDatabaseControls = {
  enlightenOptions: [
    {value: null, label: 'E0'},
    {value: 'E1', label: 'E1'},
    {value: 'E2', label: 'E2'},
    {value: 'E3', label: 'E3'},
  ],
  canAdjustPsycheSurge: true,
  psycheSurgeOffsetMin: 0,
  psycheSurgeOffsetMax: 12,
  hasSoulforgeTalent: false,
  hasGnosticPotentialTalent: false,
  canAdjustGnosticPotential: false,
  skillLevelMin: 1,
  skillLevelMax: 6,
  soulforgeLevelMin: null,
  soulforgeLevelMax: null,
  gnosticPotentialLevelMin: null,
  gnosticPotentialLevelMax: null,
}

const TEST_SCALING_RECORD = {
  stats: TEST_STATS,
  primaryScalingBase: 20 as const,
  statScaling: {
    CON: 2,
    ATK: 2,
    DEF: 2,
  },
  substatScaling: TEST_SUBSTAT_SCALING,
}

const TEST_SELECTION: AwakenerDatabaseSelection = {
  awakenerLevel: 60,
  psycheSurgeOffset: 0,
  skillLevel: 1,
  selectedEnlightenSlot: null,
  soulforgeLevel: 0,
  gnosticPotentialLevel: 0,
}

describe('AwakenerDetailSidebar', () => {
  it('keeps main and scaling stats visible, collapses other secondary stats, and exposes scaling info on demand', () => {
    const openRootInfo = vi.fn()
    const state = {
      openRootInfo,
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailSidebar
          awakener={TEST_AWAKENER}
          controls={TEST_CONTROLS}
          onPatchSelection={vi.fn()}
          scalingRecord={TEST_SCALING_RECORD}
          selection={TEST_SELECTION}
          stats={TEST_STATS}
          substatScaling={TEST_SUBSTAT_SCALING}
        />
      </PopoverStoreContext.Provider>,
    )

    expect(screen.getByRole('heading', {name: 'Stats'})).toBeInTheDocument()
    expect(screen.queryByText('(Lv. 60)')).not.toBeInTheDocument()
    expect(screen.getByText('E3+0')).toBeInTheDocument()

    expect(screen.getByText('140')).toHaveClass('text-slate-200')
    expect(screen.getByText('135')).toHaveClass('text-slate-200')
    expect(screen.getByText('126')).toHaveClass('text-slate-200')
    expect(screen.getByText('Crit Rate')).toBeInTheDocument()
    expect(screen.getByTitle('Level scaling: +1.6% per 10 levels to Lv. 60')).toHaveTextContent(
      '14.6%',
    )
    expect(screen.queryByText('Crit DMG')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))

    expect(openRootInfo).toHaveBeenCalledTimes(1)
    expect(openRootInfo.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        key: 'database:secondary-stats',
        name: 'Secondary Stats',
        label: 'Attributes',
      }),
    )
  })

  it('shows stats before progression in compact mode', () => {
    const state = {
      openRootInfo: vi.fn(),
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    const {container} = render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailSidebar
          compact
          awakener={TEST_AWAKENER}
          controls={TEST_CONTROLS}
          onPatchSelection={vi.fn()}
          scalingRecord={TEST_SCALING_RECORD}
          selection={TEST_SELECTION}
          stats={TEST_STATS}
          substatScaling={TEST_SUBSTAT_SCALING}
        />
      </PopoverStoreContext.Provider>,
    )

    const panels = Array.from(container.firstElementChild?.children ?? [])
    expect(panels).toHaveLength(2)
    expect(
      within(panels[0] as HTMLElement).getByRole('heading', {name: 'Stats'}),
    ).toBeInTheDocument()
    expect(within(panels[1] as HTMLElement).getByRole('button', {name: 'E0'})).toBeInTheDocument()
  })
})
