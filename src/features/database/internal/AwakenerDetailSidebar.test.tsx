import {fireEvent, render, screen, within} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'

import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'
import {DatabasePopoverContext} from './database-popover-context'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => null,
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
  skillLevelMin: 1,
  skillLevelMax: 6,
  soulforgeLevelMin: null,
  soulforgeLevelMax: null,
}

const TEST_SELECTION: AwakenerDatabaseSelection = {
  awakenerLevel: 60,
  psycheSurgeOffset: 0,
  skillLevel: 1,
  selectedEnlightenSlot: null,
  soulforgeLevel: 0,
}

describe('AwakenerDetailSidebar', () => {
  it('keeps main stats visible, collapses secondary stats, and exposes scaling info on demand', () => {
    const openRootInfo = vi.fn()
    render(
      <DatabasePopoverContext.Provider
        value={{
          closeAllPopovers: vi.fn(),
          hasOpenPopovers: false,
          openNestedOverlay: vi.fn(),
          openNestedReferenceByName: vi.fn(),
          openRootInfo,
          openRootOverlay: vi.fn(),
          openRootReferenceByName: vi.fn(),
        }}
      >
        <AwakenerDetailSidebar
          awakener={TEST_AWAKENER}
          controls={TEST_CONTROLS}
          onPatchSelection={vi.fn()}
          scalingRecord={TEST_SCALING_RECORD}
          selection={TEST_SELECTION}
          stats={TEST_STATS}
          substatScaling={TEST_SUBSTAT_SCALING}
        />
      </DatabasePopoverContext.Provider>,
    )

    expect(screen.getByRole('heading', {name: 'Stats'})).toBeInTheDocument()
    expect(screen.queryByText('(Lv. 60)')).not.toBeInTheDocument()
    expect(screen.getByText('E3+0')).toBeInTheDocument()

    expect(screen.getByText('140')).toHaveClass('text-slate-200')
    expect(screen.getByText('135')).toHaveClass('text-slate-200')
    expect(screen.getByText('126')).toHaveClass('text-slate-200')
    expect(screen.queryByText('Crit Rate')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))

    expect(screen.getByText('14.6%')).toHaveClass('text-slate-200')
    expect(screen.getByTitle('Level scaling: +1.6% per 10 levels to Lv. 60')).toHaveTextContent(
      '14.6%',
    )

    fireEvent.click(screen.getByRole('button', {name: /scaling info/i}))

    expect(openRootInfo).toHaveBeenCalledTimes(1)
    expect(openRootInfo.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        description: expect.stringMatching(
          /Psyche Surge adds extra secondary-stat steps after E3/i,
        ),
        detailLinks: [
          expect.objectContaining({
            label: 'Show exact breakpoints',
          }),
        ],
        key: 'database:scaling-info',
        label: 'Database Guide',
        name: 'Scaling Information',
      }),
    )
  })

  it('shows stats before progression in compact mode', () => {
    const {container} = render(
      <AwakenerDetailSidebar
        compact
        awakener={TEST_AWAKENER}
        controls={TEST_CONTROLS}
        onPatchSelection={vi.fn()}
        scalingRecord={TEST_SCALING_RECORD}
        selection={TEST_SELECTION}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    const panels = Array.from(container.querySelectorAll('.border.border-slate-600\\/30'))
    expect(panels).toHaveLength(2)
    expect(
      within(panels[0] as HTMLElement).getByRole('heading', {name: 'Stats'}),
    ).toBeInTheDocument()
    expect(within(panels[1] as HTMLElement).getByRole('button', {name: 'E0'})).toBeInTheDocument()
  })
})
