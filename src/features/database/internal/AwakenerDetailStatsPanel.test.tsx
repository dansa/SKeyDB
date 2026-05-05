import {useState} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {FullStats, SubstatScaling} from '@/domain/awakener-source-schema'

import {AwakenerDetailStatsPanel} from './AwakenerDetailStatsPanel'

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => null,
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
  CritRate: '1.6%',
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

function renderStatsPanel() {
  return render(
    <AwakenerDetailStatsPanel
      compact
      scalingRecord={TEST_SCALING_RECORD}
      stats={TEST_STATS}
      substatScaling={TEST_SUBSTAT_SCALING}
    />,
  )
}

describe('AwakenerDetailStatsPanel', () => {
  it('uses three compact columns for main stats and two for secondary stats', () => {
    const {container} = renderStatsPanel()

    expect(container.querySelector('[data-awakener-main-stats]')).toHaveClass('grid-cols-3')
    expect(screen.queryByText('Crit Rate')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))

    expect(container.querySelector('[data-awakener-secondary-stats]')).toHaveClass('grid-cols-2')
    expect(screen.getByText('Crit Rate')).toBeInTheDocument()
  })

  it('can preserve expanded state when its parent remounts it', () => {
    function ControlledHarness() {
      const [isExpanded, setIsExpanded] = useState(false)
      const [isMounted, setIsMounted] = useState(true)

      return (
        <div>
          <button
            onClick={() => {
              setIsMounted((current) => !current)
            }}
            type='button'
          >
            Toggle panel
          </button>
          {isMounted ? (
            <AwakenerDetailStatsPanel
              compact
              isExpanded={isExpanded}
              onExpandedChange={setIsExpanded}
              scalingRecord={TEST_SCALING_RECORD}
              stats={TEST_STATS}
              substatScaling={TEST_SUBSTAT_SCALING}
            />
          ) : null}
        </div>
      )
    }

    render(<ControlledHarness />)

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))
    expect(screen.getByText('Crit Rate')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Toggle panel'}))
    expect(screen.queryByText('Crit Rate')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: 'Toggle panel'}))
    expect(screen.getByText('Crit Rate')).toBeInTheDocument()
  })
})
