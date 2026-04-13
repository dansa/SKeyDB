import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'
import type {
  AwakenerFullStats,
  AwakenerStatScaling,
  AwakenerSubstatScaling,
} from '@/domain/awakeners-full'

import {AwakenerDetailSidebar} from './AwakenerDetailSidebar'

vi.mock('@/domain/awakener-assets', () => ({
  getAwakenerCardAsset: () => null,
}))

vi.mock('@/domain/name-format', () => ({
  formatAwakenerNameForUi: (name: string) => name,
}))

vi.mock('@/domain/mainstats', () => ({
  getColoredMainstatIcon: (key: string) => `color-${key}`,
  getMainstatAccentColor: (key: string) =>
    key === 'ATK' ? '#a1525a' : key === 'CRIT_RATE' ? '#d8b56a' : '#638ea6',
  getMainstatIcon: (key: string) => `icon-${key}`,
}))

vi.mock('../../DatabaseMain', () => ({
  AwakenerLevelSlider: ({level}: {level: number}) => <div>Level slider {level}</div>,
}))

vi.mock('../Controls', () => ({
  DetailLevelSlider: ({label, level}: {label: string; level: number}) => (
    <div>
      {label} slider {level}
    </div>
  ),
  SkillLevelSlider: ({level}: {level: number}) => <div>Skill slider {level}</div>,
}))

const TEST_AWAKENER: Awakener = {
  id: 1,
  name: 'thais',
  realm: 'AEQUOR',
  faction: 'Test',
  type: 'ASSAULT',
  rarity: 'SSR',
  aliases: ['thais'],
  tags: [],
}

const TEST_STATS: AwakenerFullStats = {
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
  BaseAliemus: '100',
}

const TEST_SUBSTAT_SCALING: AwakenerSubstatScaling = {
  CritRate: '1.6%',
}

const TEST_STAT_SCALING: AwakenerStatScaling = {
  CON: 1.2,
  ATK: 1.8,
  DEF: 1.1,
}

const TEST_SCALING_PREVIEW_SOURCE = {
  stats: TEST_STATS,
  primaryScalingBase: 30 as const,
  statScaling: TEST_STAT_SCALING,
  substatScaling: TEST_SUBSTAT_SCALING,
}

describe('AwakenerDetailSidebar', () => {
  it('shows brighter primary stats, highlights scaling substats, and opens a psyche surge bubble for scaling rows', () => {
    render(
      <AwakenerDetailSidebar
        awakener={TEST_AWAKENER}
        enlightenOffset={0}
        level={60}
        onLevelChange={vi.fn()}
        onPsycheSurgeChange={vi.fn()}
        onSkillLevelChange={vi.fn()}
        scalingPreviewSource={TEST_SCALING_PREVIEW_SOURCE}
        skillLevel={4}
        statScaling={TEST_STAT_SCALING}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.queryByRole('heading', {name: 'Attributes'})).not.toBeInTheDocument()
    expect(screen.getByText('Psyche Surge slider 0')).toBeInTheDocument()
    expect(screen.getByText('Level slider 60')).toBeInTheDocument()
    expect(screen.getByText('Skill slider 4')).toBeInTheDocument()

    expect(screen.getByText('ATK').parentElement).toHaveClass('text-slate-400')
    expect(screen.getByText('135')).toHaveClass('text-slate-200')
    expect(screen.getByText('50%')).toHaveClass('text-slate-500/60')
    expect(document.querySelector('img[src="color-CRIT_RATE"]')).not.toBeNull()
    expect(screen.getByTitle('Level scaling: +1.6% per 10 levels to Lv. 60')).toHaveTextContent(
      '14.6%',
    )

    const critRateButton = screen.getByText('Crit Rate').closest('button')
    expect(critRateButton).not.toBeNull()
    if (critRateButton) fireEvent.click(critRateButton)

    expect(screen.getByText('Scaling')).toBeInTheDocument()
    expect(screen.getByText(/E3\+0/)).toBeInTheDocument()
    const levelZeroEntries = screen.getAllByText(/E3\+0/)
    expect(levelZeroEntries[0]?.closest('div')).toHaveClass('bg-amber-400/10')
    expect(screen.getAllByText(/E3\+12/)[0]).toBeInTheDocument()
    expect(screen.getByText('33.8%')).toBeInTheDocument()
  })

  it('supports a collapsible configuration block in compact mode', () => {
    render(
      <AwakenerDetailSidebar
        awakener={TEST_AWAKENER}
        compact
        enlightenOffset={0}
        level={60}
        onLevelChange={vi.fn()}
        onPsycheSurgeChange={vi.fn()}
        onSkillLevelChange={vi.fn()}
        scalingPreviewSource={TEST_SCALING_PREVIEW_SOURCE}
        skillLevel={4}
        statScaling={TEST_STAT_SCALING}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    // Initially expanded
    expect(screen.getByText('Level slider 60')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('HIDE')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
    expect(screen.getByText('Attributes')).toBeInTheDocument()

    // Collapse
    fireEvent.click(screen.getByRole('button', {name: /Configuration/i}))
    expect(screen.queryByText('Level slider 60')).not.toBeInTheDocument()
    expect(screen.queryByText('ATK')).not.toBeInTheDocument()
    expect(screen.getByText('Configuration / Attributes')).toBeInTheDocument()
    expect(screen.getByText('SHOW')).toBeInTheDocument()

    // Expand again
    fireEvent.click(screen.getByRole('button', {name: /Configuration/i}))
    expect(screen.getByText('Level slider 60')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('HIDE')).toBeInTheDocument()
  })

  it('renders both Configuration and Attributes headers in desktop mode without toggle', () => {
    render(
      <AwakenerDetailSidebar
        awakener={TEST_AWAKENER}
        enlightenOffset={0}
        level={60}
        onLevelChange={vi.fn()}
        onPsycheSurgeChange={vi.fn()}
        onSkillLevelChange={vi.fn()}
        scalingPreviewSource={TEST_SCALING_PREVIEW_SOURCE}
        skillLevel={4}
        statScaling={TEST_STAT_SCALING}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByText('Level slider 60')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()
    expect(screen.getByText('Attributes')).toBeInTheDocument()
    expect(screen.queryByRole('button', {name: /Configuration/i})).not.toBeInTheDocument()
  })
})
