import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import '../../builder-page.integration-mocks'

import {BuilderDndProvider} from './BuilderDndProvider'

const dndContextSpy = vi.fn()

vi.mock('@dnd-kit/core', async () => {
  return {
    closestCenter: () => null,
    DndContext: ({autoScroll, children}: {autoScroll?: boolean; children: React.ReactNode}) => {
      dndContextSpy(autoScroll)
      return (
        <div data-auto-scroll={String(autoScroll)} data-testid='mock-dnd-context'>
          {children}
        </div>
      )
    },
    DragOverlay: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    PointerSensor: function PointerSensor() {
      return undefined
    },
    TouchSensor: function TouchSensor() {
      return undefined
    },
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
  }
})

vi.mock('./useBuilderV2Dnd', () => ({
  useBuilderV2Dnd: () => ({
    activeDrag: null,
    isRemoveIntent: false,
    sensors: [],
    handleDragStart: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  }),
}))

const actions = {
  handleDropPickerAwakener: vi.fn(),
  handleDropPickerCovenant: vi.fn(),
  handleDropPickerWheel: vi.fn(),
  handleDropTeamCovenant: vi.fn(),
  handleDropTeamCovenantToSlot: vi.fn(),
  handleDropTeamWheel: vi.fn(),
  handleDropTeamWheelToSlot: vi.fn(),
  handleSetActivePosse: vi.fn(),
}

describe('BuilderDndProvider', () => {
  it('disables dnd auto-scroll so page drag does not pull the viewport around', () => {
    render(
      <BuilderDndProvider actions={actions}>
        <div>child</div>
      </BuilderDndProvider>,
    )

    expect(screen.getByTestId('mock-dnd-context')).toHaveAttribute('data-auto-scroll', 'false')
    expect(dndContextSpy).toHaveBeenCalledWith(false)
  })
})
