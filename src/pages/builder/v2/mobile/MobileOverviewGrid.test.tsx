import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import '../../../builder-page.integration-mocks'

import {useBuilderStore} from '../store/builder-store'
import {MobileOverviewGrid} from './MobileOverviewGrid'

const {useCollectionOwnership} = vi.hoisted(() => ({
  useCollectionOwnership: vi.fn(() => ({
    ownedAwakenerLevelByName: new Map([
      ['agrippa', 1],
      ['casiah', 2],
      ['goliath', 3],
      ['castor', null],
    ]),
  })),
}))

vi.mock('../layout-hooks', () => ({
  useMeasuredElementSize: () => ({
    height: 66,
    ref: {current: null},
    width: 335,
  }),
}))

vi.mock('../useCollectionOwnership', () => ({
  useCollectionOwnership,
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

function seedSupportSlot1Awakener() {
  const state = useBuilderStore.getState()
  state.setActiveTeamSlots(
    state.teams[0].slots.map((slot, index) =>
      index === 0
        ? {
            ...slot,
            awakenerName: 'agrippa',
            isSupport: true,
            level: 90,
            realm: 'AEQUOR',
            wheels: [null, null] as [null, null],
          }
        : slot,
    ),
  )
}

function seedAllSlots() {
  const state = useBuilderStore.getState()
  const names = ['agrippa', 'casiah', 'goliath', 'castor'] as const
  const realms = ['AEQUOR', 'CARO', 'CHAOS', 'ULTRA'] as const

  state.setActiveTeamSlots(
    state.teams[0].slots.map((slot, index) => ({
      ...slot,
      awakenerName: names[index],
      level: 60,
      realm: realms[index],
      wheels: [null, null] as [null, null],
    })),
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

  it('reads collection ownership once per grid render instead of once per populated card', () => {
    resetStore()
    seedAllSlots()

    render(<MobileOverviewGrid onDeployEmpty={() => undefined} onFocusSlot={() => undefined} />)

    expect(useCollectionOwnership.mock.calls.length).toBeLessThanOrEqual(2)
  })

  it('shows support state and max enlighten for support awakeners', () => {
    resetStore()
    seedSupportSlot1Awakener()

    render(<MobileOverviewGrid onDeployEmpty={() => undefined} onFocusSlot={() => undefined} />)

    expect(screen.getByText('Support')).toBeInTheDocument()
    expect(screen.getByText(/Lv\. 90, Enlighten 15/i)).toBeInTheDocument()
  })
})
