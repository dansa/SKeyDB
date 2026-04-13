import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {AwakenerBuild} from '@/domain/awakener-builds'

import {AwakenerBuildCard} from './AwakenerBuildsTabSections'

vi.mock('@/components/ui/CompactArtTile', () => ({
  CompactArtTile: ({
    chips,
    name,
    preview,
  }: {
    chips: React.ReactNode
    name: string
    preview: React.ReactNode
  }) => (
    <div>
      <div>{name}</div>
      <div>{chips}</div>
      <div>{preview}</div>
    </div>
  ),
}))

vi.mock('@/domain/covenant-assets', () => ({
  getCovenantAssetById: (id: string) => `covenant-${id}`,
}))

vi.mock('@/domain/covenants', () => ({
  getCovenants: () => [
    {id: '001', name: 'Crimson Pulse'},
    {id: '002', name: 'Rabbit'},
  ],
}))

vi.mock('@/domain/mainstats', async () => {
  const actual = await vi.importActual<typeof import('@/domain/mainstats')>('@/domain/mainstats')
  return {
    ...actual,
    getMainstatByKey: (key: string) => ({
      label: key === 'ATK' ? 'Attack' : key === 'CON' ? 'CON' : key,
    }),
    getMainstatIcon: (key: string) => (key === 'ATK' ? 'atk-icon' : null),
  }
})

vi.mock('@/domain/wheel-assets', () => ({
  getWheelAssetById: (id: string) => `wheel-${id}`,
}))

vi.mock('@/domain/wheels', () => ({
  getWheelById: (id: string) => ({name: `Wheel ${id}`}),
}))

const TEST_BUILD: AwakenerBuild = {
  id: 'dps',
  label: 'DPS',
  summary: 'Summary',
  note: 'Note text',
  substatPriorityGroups: [['ATK', 'CON'], ['DEF']],
  recommendedWheels: [
    {tier: 'BIS_SSR', wheelIds: ['A1']},
    {tier: 'GOOD', wheelIds: ['B2']},
  ],
  recommendedCovenantIds: ['001', '002'],
}

describe('AwakenerBuildCard', () => {
  it('supports collapsible build sections', () => {
    render(<AwakenerBuildCard build={TEST_BUILD} collapsible defaultCollapsed showLabel />)

    expect(screen.queryByText('Summary')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', {name: /DPS/}))

    expect(screen.getByText('Summary')).toBeInTheDocument()
    expect(screen.queryByText('SHOW')).toBeNull()
  })

  it('omits the good options block when the build has no GOOD wheel tier', () => {
    render(
      <AwakenerBuildCard
        build={{...TEST_BUILD, recommendedWheels: [{tier: 'BIS_SSR', wheelIds: ['A1']}]}}
        showLabel={false}
      />,
    )

    expect(screen.getByText('Top Picks')).toBeInTheDocument()
    expect(screen.queryByText('Good Options')).toBeNull()
  })

  it('renders grouped wheel and covenant recommendations with priority chips', () => {
    render(<AwakenerBuildCard build={TEST_BUILD} showLabel={false} />)

    expect(screen.getByText('Wheel A1')).toBeInTheDocument()
    expect(screen.getByText('BiS SSR')).toBeInTheDocument()
    expect(screen.getByText('Wheel B2')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Crimson Pulse')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('Rabbit')).toBeInTheDocument()
    expect(screen.getByText('#2')).toBeInTheDocument()
  })
})
