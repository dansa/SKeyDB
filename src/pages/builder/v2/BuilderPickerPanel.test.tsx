import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderPickerPanel} from './BuilderPickerPanel'
import {useBuilderStore} from './store/builder-store'

function resetStore() {
  useBuilderStore.setState(useBuilderStore.getInitialState(), true)
}

function seedSlot1Awakener(awakenerName: 'goliath' | 'agrippa' = 'goliath') {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) =>
    index === 0
      ? {
          ...slot,
          awakenerName,
          realm: awakenerName === 'goliath' ? 'CHAOS' : 'AEQUOR',
          level: 60,
          wheels: [null, null] as [null, null],
          covenantId: undefined,
        }
      : slot,
  )

  state.setActiveTeamSlots(nextSlots)
  state.clearSelection()
}

describe('BuilderPickerPanel', () => {
  it('remembers search query per picker tab when switching tabs', () => {
    resetStore()

    render(<BuilderPickerPanel />)

    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'agr'}})
    fireEvent.click(screen.getByRole('button', {name: /Wheels/i}))
    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'merc'}})
    fireEvent.click(screen.getByRole('button', {name: /Awakeners/i}))

    expect(screen.getByRole('searchbox')).toHaveValue('agr')
  })

  it('shows wheel recommendation controls and chips for the active build', () => {
    resetStore()
    seedSlot1Awakener('goliath')
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)

    render(<BuilderPickerPanel />)

    fireEvent.click(screen.getByRole('button', {name: /Sorting & Toggles/i}))

    expect(screen.getByText(/Promote Recommendations/i)).toBeInTheDocument()
    expect(screen.getByText(/^BiS$/i)).toBeInTheDocument()
  })

  it('can disable picker drag and drop across all picker tabs', () => {
    resetStore()

    const {container} = render(<BuilderPickerPanel enableDragAndDrop={false} />)

    expect(container.querySelector("[data-picker-kind='awakener']")).toHaveAttribute(
      'data-picker-draggable',
      'false',
    )

    fireEvent.click(screen.getByRole('button', {name: /Wheels/i}))
    expect(container.querySelector("[data-picker-kind='wheel']")).toHaveAttribute(
      'data-picker-draggable',
      'false',
    )

    fireEvent.click(screen.getByRole('button', {name: /Covenants/i}))
    expect(container.querySelector("[data-picker-kind='covenant']")).toHaveAttribute(
      'data-picker-draggable',
      'false',
    )

    fireEvent.click(screen.getByRole('button', {name: /Posses/i}))
    expect(container.querySelector("[data-picker-kind='posse']")).toHaveAttribute(
      'data-picker-draggable',
      'false',
    )
  })
})
