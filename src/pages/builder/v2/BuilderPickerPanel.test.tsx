import type {ComponentProps} from 'react'

import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderPickerPanel} from './BuilderPickerPanel'
import {useBuilderStore} from './store/builder-store'
import {useBuilderV2Actions} from './useBuilderV2Actions'

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

function seedTeamAwakeners(
  awakeners: ({awakenerName: string; realm: string} | null)[],
  selectedSlotId?: string,
) {
  const state = useBuilderStore.getState()
  const nextSlots = state.teams[0].slots.map((slot, index) => {
    const seeded = awakeners[index]
    if (!seeded) {
      return {
        ...slot,
        awakenerName: undefined,
        realm: undefined,
        level: undefined,
        wheels: [null, null] as [null, null],
        covenantId: undefined,
      }
    }

    return {
      ...slot,
      awakenerName: seeded.awakenerName,
      realm: seeded.realm,
      level: 60,
      wheels: [null, null] as [null, null],
      covenantId: undefined,
    }
  })

  state.setActiveTeamSlots(nextSlots)
  if (selectedSlotId) {
    state.setActiveSelection({kind: 'awakener', slotId: selectedSlotId})
    return
  }
  state.clearSelection()
}

function TestPickerPanel(props: Omit<ComponentProps<typeof BuilderPickerPanel>, 'actions'>) {
  const actions = useBuilderV2Actions()
  return <BuilderPickerPanel actions={actions} {...props} />
}

describe('BuilderPickerPanel', () => {
  it('remembers search query per picker tab when switching tabs', () => {
    resetStore()

    render(<TestPickerPanel />)

    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'agr'}})
    fireEvent.click(screen.getByRole('button', {name: /Wheels/i}))
    fireEvent.change(screen.getByRole('searchbox'), {target: {value: 'merc'}})
    fireEvent.click(screen.getByRole('button', {name: /Awakeners/i}))

    expect(screen.getByRole('searchbox')).toHaveValue('agr')
  })

  it('captures global typing into the active picker search and focuses the field', () => {
    resetStore()

    render(<TestPickerPanel />)

    fireEvent.keyDown(window, {key: 'r'})
    fireEvent.keyDown(window, {key: 'a'})
    fireEvent.keyDown(window, {key: 'm'})

    const searchbox = screen.getByRole('searchbox')
    expect(searchbox).toHaveValue('ram')
    expect(searchbox).toHaveFocus()
  })

  it('renders a wide sidebar picker layout when requested', () => {
    resetStore()

    render(<TestPickerPanel layoutVariant='wide-sidebar' />)

    expect(screen.getByTestId('builder-picker-panel')).toHaveAttribute(
      'data-layout-variant',
      'wide-sidebar',
    )
    expect(screen.getByTestId('builder-picker-controls-rail')).toContainElement(
      screen.getByRole('searchbox'),
    )
    expect(screen.getByTestId('builder-picker-controls-rail')).toContainElement(
      screen.getByRole('button', {name: /Sorting & Toggles/i}),
    )
    expect(screen.getByTestId('builder-picker-controls-rail')).not.toContainElement(
      screen.getByRole('button', {name: /Awakeners/i}),
    )
    expect(screen.getByTestId('builder-picker-results-shell')).toContainElement(
      screen.getByRole('button', {name: /Awakeners/i}),
    )
    expect(screen.getByTestId('builder-picker-results-pane')).toBeInTheDocument()
    expect(screen.getByTestId('builder-picker-filter-groups')).toHaveAttribute(
      'data-layout',
      'wide-sidebar',
    )
    expect(screen.getByTestId('builder-picker-controls-rail')).not.toHaveStyle({
      overscrollBehaviorY: 'contain',
    })
  })

  it('can tighten stacked picker tile width for denser desktop result grids', () => {
    resetStore()

    render(<TestPickerPanel layoutVariant='stacked' tileMinWidthPx={72} />)

    expect(screen.getByTestId('builder-picker-panel')).toHaveStyle({
      '--builder-picker-tile-min-width': '72px',
    })
  })

  it('shows wheel recommendation controls and chips for the active build', () => {
    resetStore()
    seedSlot1Awakener('goliath')
    useBuilderStore.getState().toggleWheelSelection('slot-1', 0)

    render(<TestPickerPanel />)

    fireEvent.click(screen.getByRole('button', {name: /Sorting & Toggles/i}))

    expect(screen.getByText(/Promote Recommendations/i)).toBeInTheDocument()
    expect(screen.getByText(/^BiS$/i)).toBeInTheDocument()
  })

  it('can disable picker drag and drop across all picker tabs', () => {
    resetStore()

    const {container} = render(<TestPickerPanel enableDragAndDrop={false} />)

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

  it('does not mark a new realm as blocked when replacing the slot that currently supplies the second realm', () => {
    resetStore()
    seedTeamAwakeners(
      [
        {awakenerName: 'goliath', realm: 'CHAOS'},
        {awakenerName: 'ramona', realm: 'CHAOS'},
        {awakenerName: 'helot', realm: 'CHAOS'},
        {awakenerName: 'casiah', realm: 'CARO'},
      ],
      'slot-4',
    )

    render(<TestPickerPanel />)

    const agrippaTile = screen.getByText('Agrippa').closest('button')
    expect(agrippaTile).toHaveAttribute('data-realm-blocked', 'false')
  })
})
