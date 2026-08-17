import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabasePopoverSurface, useDatabasePopoverSurface, type DatabasePopoverEntry} from '.'

const mocks = vi.hoisted(() => ({
  buildReferenceLayer: vi.fn(() => ({kind: 'reference-layer'})),
  openedAnchor: undefined as HTMLElement | undefined,
  openRootInfo: vi.fn((_entry: unknown, event: {currentTarget: HTMLElement}) => {
    mocks.openedAnchor = event.currentTarget
  }),
  renderRoot: vi.fn((_props: unknown) => <div data-testid='popover-root' />),
}))

vi.mock('@/domain/global-database-reference-layer', () => ({
  buildGlobalDatabaseReferenceLayer: mocks.buildReferenceLayer,
}))

vi.mock('../internal/useDatabasePopoverController', () => ({
  useDatabasePopoverController: () => ({
    contextValue: {
      closeAllPopovers: vi.fn(),
      hasOpenPopovers: false,
      openNestedOverlay: vi.fn(),
      openNestedReferenceByName: vi.fn(),
      openRootInfo: mocks.openRootInfo,
      openRootOverlay: vi.fn(),
      openRootReferenceByName: vi.fn(),
    },
    popoverRootProps: {entries: []},
  }),
}))

vi.mock('../internal/useDatabaseDetailPreferences', () => ({
  useDatabaseDetailPreferences: () => ({
    preferences: {shared: {clickOutsideClosesPopovers: true}},
  }),
}))

vi.mock('../internal/DatabasePopoverRoot', () => ({
  DatabasePopoverRoot: (props: unknown) => mocks.renderRoot(props),
}))

const testEntry = {
  key: 'dzone-monster:test',
  name: 'Test Monster',
  label: '',
  description: '',
} satisfies DatabasePopoverEntry

function PopoverConsumer() {
  const {openRootInfo} = useDatabasePopoverSurface()
  return (
    <button
      onClick={(event) => {
        openRootInfo(testEntry, event)
      }}
      type='button'
    >
      Open info
    </button>
  )
}

describe('DatabasePopoverSurface', () => {
  it('exposes the root info action and owns the shared root preference wiring', () => {
    render(
      <DatabasePopoverSurface>
        <PopoverConsumer />
      </DatabasePopoverSurface>,
    )

    const button = screen.getByRole('button', {name: 'Open info'})
    fireEvent.click(button)

    expect(mocks.openRootInfo).toHaveBeenCalledWith(testEntry, expect.any(Object))
    expect(mocks.openedAnchor).toBe(button)
    expect(mocks.renderRoot).toHaveBeenCalledWith(
      expect.objectContaining({closeOnOutsideClick: true, entries: []}),
    )
    expect(screen.getByTestId('popover-root')).toBeInTheDocument()
  })
})
