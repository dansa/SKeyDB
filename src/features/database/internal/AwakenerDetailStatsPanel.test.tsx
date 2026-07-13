import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'

import {AwakenerDetailStatsPanel} from './AwakenerDetailStatsPanel'
import {PopoverStoreContext} from './usePopoverStore'

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

const TEST_STATS: FullStats = {
  CON: '132',
  ATK: '112',
  DEF: '136',
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
  RealmMastery: '1',
  SigilYield: '0.5%',
}

const TEST_SCALING_RECORD = {
  stats: TEST_STATS,
  primaryScalingBase: 20 as const,
  statScaling: {
    CON: 1.65,
    ATK: 1.4,
    DEF: 1.7,
  },
  substatScaling: TEST_SUBSTAT_SCALING,
}

const mockOpenRootInfo = vi.fn()
const mockStore = {
  getState: () => ({openRootInfo: mockOpenRootInfo}),
  subscribe: vi.fn(),
} as any

function renderStatsPanel() {
  return render(
    <PopoverStoreContext.Provider value={mockStore}>
      <AwakenerDetailStatsPanel
        compact
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />
    </PopoverStoreContext.Provider>,
  )
}

describe('AwakenerDetailStatsPanel', () => {
  it('shows scaling substats in the default stat set and opens popover on click', () => {
    mockOpenRootInfo.mockClear()
    const {container} = renderStatsPanel()

    expect(container.querySelector('[data-awakener-main-stats]')).toHaveClass('grid-cols-3')
    expect(screen.getByText('CON')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('DEF')).toBeInTheDocument()
    expect(screen.getByText('Realm Mastery')).toBeInTheDocument()
    expect(screen.getByText('Sigil Yield')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))

    expect(mockOpenRootInfo).toHaveBeenCalledTimes(1)
    expect(mockOpenRootInfo.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        key: 'database:secondary-stats',
        name: 'Secondary Stats',
        attributeRows: expect.arrayContaining([
          expect.objectContaining({label: 'Crit Rate', value: '14.6%'}),
        ]),
      }),
    )
  })

  it('triggers popover when show all stats is clicked in controlled setup', () => {
    mockOpenRootInfo.mockClear()
    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerDetailStatsPanel
          compact
          isExpanded={false}
          onExpandedChange={vi.fn()}
          scalingRecord={TEST_SCALING_RECORD}
          stats={TEST_STATS}
          substatScaling={TEST_SUBSTAT_SCALING}
        />
      </PopoverStoreContext.Provider>,
    )

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))
    expect(mockOpenRootInfo).toHaveBeenCalledTimes(1)
  })
})
