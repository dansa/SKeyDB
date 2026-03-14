import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import '../../../builder-page.integration-mocks'

import {useBuilderStore} from '../store/builder-store'
import {MobileOverviewGrid} from './MobileOverviewGrid'

vi.mock('./layout-hooks', () => ({
  useMeasuredElementSize: () => ({
    height: 66,
    ref: {current: null},
    width: 335,
  }),
}))

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedSlot1Awakener() {
  const state = useBuilderStore.getState()
  state.setActiveTeamSlots(
    state.teams[0].slots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            awakenerName: 'agrippa',
            level: 60,
            realm: 'AEQUOR',
            wheels: [null, null] as [null, null],
          }
        : slot,
    ),
  )
}

describe('MobileOverviewGrid', () => {
  it('hands overflow back to the page once the measured grid area hits the minimum card floor', () => {
    resetStore()
    seedSlot1Awakener()

    render(<MobileOverviewGrid onDeployEmpty={() => undefined} onFocusSlot={() => undefined} />)

    const grid = screen.getByTestId('mobile-overview-grid')

    expect(grid).not.toHaveClass('overflow-y-auto')
    expect(grid).toHaveAttribute('data-columns', '4')
    expect(grid).toHaveStyle({
      gridTemplateRows: 'repeat(1, 73.8px)',
    })
    expect(grid.parentElement).toHaveStyle({
      minHeight: '89.8px',
    })
    expect(screen.getByRole('button', {name: /Agrippa card Agrippa/i})).toHaveStyle({
      height: '73.8px',
      width: '73.8px',
    })
  })
})
