import {fireEvent, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderCardGrid} from './BuilderCardGrid'
import {BuilderDndStateProvider} from './BuilderDndStateContext'
import {useBuilderStore} from './store/builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedSlot1Loadout() {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) =>
    index === 0
      ? {
          ...slot,
          awakenerName: 'agrippa',
          realm: 'AEQUOR',
          level: 60,
          wheels: ['001', '002'] as [string | null, string | null],
          covenantId: '001',
        }
      : index === 1
        ? {
            ...slot,
            awakenerName: 'goliath',
            realm: 'CHAOS',
            level: 60,
            wheels: [null, null] as [string | null, string | null],
            covenantId: undefined,
          }
        : slot,
  )

  state.setActiveTeamSlots(nextSlots)
  state.clearSelection()
}

function renderGridWithDndState({
  activeDragKind = null,
  predictedDropHover = null,
}: {
  activeDragKind?: 'picker-wheel' | 'picker-covenant' | null
  predictedDropHover?:
    | {kind: 'wheel'; slotId: string; wheelIndex: number}
    | {kind: 'covenant'; slotId: string}
    | null
}) {
  return render(
    <BuilderDndStateProvider
      value={{
        activeDragKind,
        predictedDropHover,
      }}
    >
      <BuilderCardGrid />
    </BuilderDndStateProvider>,
  )
}

describe('BuilderCardGrid', () => {
  it('surfaces predicted wheel hover state through the shared card zones', async () => {
    resetStore()
    seedSlot1Loadout()

    const {container} = renderGridWithDndState({
      activeDragKind: 'picker-wheel',
      predictedDropHover: {kind: 'wheel', slotId: 'slot-2', wheelIndex: 0},
    })

    fireEvent.load(screen.getByAltText(/goliath card/i))

    await waitFor(() => {
      expect(container.querySelector('.wheel-tile-over')).toBeTruthy()
    })
  })

  it('surfaces predicted covenant hover state through the shared card zones', async () => {
    resetStore()
    seedSlot1Loadout()

    const {container} = renderGridWithDndState({
      activeDragKind: 'picker-covenant',
      predictedDropHover: {kind: 'covenant', slotId: 'slot-2'},
    })

    fireEvent.load(screen.getByAltText(/goliath card/i))

    await waitFor(() => {
      expect(container.querySelector('.covenant-tile-over')).toBeTruthy()
    })
  })

  it('removes the active wheel selection from the slot', async () => {
    resetStore()
    seedSlot1Loadout()
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)

    renderGridWithDndState({})

    fireEvent.load(screen.getByAltText(/agrippa card/i))
    fireEvent.click(await screen.findByRole('button', {name: /Remove active wheel/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0]?.slots[0]?.wheels[0]).toBeNull()
      expect(useBuilderStore.getState().activeSelection).toBeNull()
    })
  })

  it('removes the active covenant selection from the slot', async () => {
    resetStore()
    seedSlot1Loadout()
    useBuilderStore.getState().toggleCovenantSelection('slot-1')

    renderGridWithDndState({})

    fireEvent.load(screen.getByAltText(/agrippa card/i))
    fireEvent.click(await screen.findByRole('button', {name: /Remove active covenant/i}))

    await waitFor(() => {
      expect(useBuilderStore.getState().teams[0]?.slots[0]?.covenantId).toBeUndefined()
      expect(useBuilderStore.getState().activeSelection).toBeNull()
    })
  })
})
