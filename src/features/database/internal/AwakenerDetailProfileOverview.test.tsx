import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {SubstatScaling} from '@/domain/awakener-source-schema'

import {AwakenerDetailOverview} from './AwakenerDetailOverview'
import {
  makeTestAwakener,
  makeTestAwakenerFullRecord,
  makeTestFullStats,
} from './database-test-fixtures'

vi.mock('@/domain/mainstats', () => ({
  getMainstatIcon: () => null,
}))

const TEST_AWAKENER = makeTestAwakener({
  id: 2,
  name: 'agrippa',
  realm: 'CARO',
  faction: 'Outlanders',
  type: 'WARDEN',
})

const TEST_STATS = makeTestFullStats({
  CON: '132',
  ATK: '112',
  DEF: '136',
  CritRate: '14.6%',
})

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

const TEST_FULL_DATA = makeTestAwakenerFullRecord({
  id: 2,
  displayName: 'Agrippa',
  profile: {
    title: 'Agrippa',
    birthday: '15-Apr',
    gender: 'Female',
    height: "5'2''",
    weight: '90lbs',
    gnosticIndex: '?',
    storySections: [
      {
        kind: 'introduction',
        title: 'Basic Information',
        unlockCondition: 'Awakener Level 1',
        content: 'Before the flames of history consumed everything, Agrippa was Capua crown jewel.',
      },
      {
        kind: 'story',
        title: 'Story: I',
        unlockCondition: 'Awakener Level 3',
        content: 'The Usurper record was filed beneath the ruins.',
      },
      {
        kind: 'story',
        title: 'Story: II',
        unlockCondition: 'Affinity Level 5',
        content: '<Italic:Arithmetic: Zero points.> <Bold:English: Failing.>',
      },
    ],
  },
})

const TEST_FULL_DATA_WITH_PROFILE_FACTION = makeTestAwakenerFullRecord({
  ...TEST_FULL_DATA,
  profile: {
    ...TEST_FULL_DATA.profile,
    faction: 'Lemuria',
  },
})

describe('AwakenerDetailOverview profile and stories', () => {
  it('renders profile facts without inventing missing faction data', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByText('Birthday')).toBeInTheDocument()
    expect(screen.getByText('15-Apr')).toBeInTheDocument()
    expect(screen.getByText('Gnostic Index')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.queryByText('Faction')).not.toBeInTheDocument()
    expect(screen.queryByText('Outlanders')).not.toBeInTheDocument()
  })

  it('uses the profile faction and places it after gnostic index', () => {
    const {container} = render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        fontScale='medium'
        fullData={TEST_FULL_DATA_WITH_PROFILE_FACTION}
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByText('Faction')).toBeInTheDocument()
    expect(screen.getByText('Lemuria')).toBeInTheDocument()
    expect(screen.queryByText('Outlanders')).not.toBeInTheDocument()

    const labels = Array.from(container.querySelectorAll('dt')).map((label) =>
      label.textContent.trim(),
    )
    expect(labels.at(-1)).toBe('Faction')
    expect(labels.indexOf('Gnostic Index')).toBeLessThan(labels.indexOf('Faction'))
  })

  it('keeps CON ATK DEF visible and reveals secondary stats on demand', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByText('CON')).toBeInTheDocument()
    expect(screen.getByText('132')).toBeInTheDocument()
    expect(screen.getByText('ATK')).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.getByText('DEF')).toBeInTheDocument()
    expect(screen.getByText('136')).toBeInTheDocument()
    expect(screen.queryByText('Crit Rate')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /show all stats/i}))

    expect(screen.getByText('Crit Rate')).toBeInTheDocument()
    expect(screen.getByText('14.6%')).toBeInTheDocument()
  })

  it('browses stories by unlock condition without rendering lock affordances', () => {
    render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    expect(screen.getByRole('tab', {name: /Intro/})).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('Awakener Level 1')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/lock/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', {name: /II/}))

    expect(screen.getByText('Affinity Level 5')).toBeInTheDocument()
    expect(screen.getAllByText(/Arithmetic: Zero points/).length).toBeGreaterThan(0)
  })

  it('renders story emphasis markup through the wheel lore parser', () => {
    const {container} = render(
      <AwakenerDetailOverview
        awakener={TEST_AWAKENER}
        fontScale='medium'
        fullData={TEST_FULL_DATA}
        scalingRecord={TEST_SCALING_RECORD}
        stats={TEST_STATS}
        substatScaling={TEST_SUBSTAT_SCALING}
      />,
    )

    fireEvent.click(screen.getByRole('tab', {name: /II/}))

    expect(container.querySelector('em')).toHaveTextContent('Arithmetic: Zero points.')
    expect(container.querySelector('strong')).toHaveTextContent('English: Failing.')
  })
})
