import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AwakenerEnlightenInfluenceBadges} from './AwakenerEnlightenInfluenceBadges'
import {PopoverStoreContext} from './usePopoverStore'

describe('AwakenerEnlightenInfluenceBadges', () => {
  it('opens root references through the popover controller and toggles enlighten slots on context menu', () => {
    const openRootReferenceByName = vi.fn()
    const onToggleEnlightenSlot = vi.fn()
    const state = {
      openNestedReferenceByName: vi.fn(),
      openRootReferenceByName,
    }
    const mockStore = {
      getState: () => state,
      subscribe: vi.fn(),
    } as any

    render(
      <PopoverStoreContext.Provider value={mockStore}>
        <AwakenerEnlightenInfluenceBadges
          influenceBadges={[
            {
              kind: 'enlighten',
              id: 'enlighten.test.e1',
              label: 'E1',
              referenceName: 'First Bloom',
              slot: 'E1',
            },
            {
              kind: 'talent',
              id: 'talent.t1',
              label: 'T1',
              referenceName: 'Base Talent',
            },
          ]}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          selectedEnlightenSlot='E2'
        />
      </PopoverStoreContext.Provider>,
    )

    fireEvent.click(screen.getByRole('button', {name: 'E1'}))
    expect(openRootReferenceByName).toHaveBeenNthCalledWith(1, 'First Bloom', expect.anything())

    fireEvent.click(screen.getByRole('button', {name: 'T1'}))
    expect(openRootReferenceByName).toHaveBeenNthCalledWith(2, 'Base Talent', expect.anything())

    fireEvent.contextMenu(screen.getByRole('button', {name: 'E1'}))
    expect(onToggleEnlightenSlot).toHaveBeenCalledWith('E1')

    fireEvent.contextMenu(screen.getByRole('button', {name: 'T1'}))
    expect(onToggleEnlightenSlot).toHaveBeenCalledTimes(1)
  })

  it('opens nested references through the explicit callback without requiring popover context', () => {
    const onOpenReferenceName = vi.fn()

    render(
      <AwakenerEnlightenInfluenceBadges
        influenceBadges={[
          {
            kind: 'enlighten',
            id: 'enlighten.e1',
            label: 'E1',
            referenceName: 'First Bloom',
            slot: 'E1',
          },
          {
            kind: 'talent',
            id: 'talent.t1',
            label: 'T1',
            referenceName: 'Base Talent',
          },
        ]}
        onOpenReferenceName={onOpenReferenceName}
        openMode='nested'
        selectedEnlightenSlot={null}
      />,
    )

    fireEvent.click(screen.getByRole('button', {name: 'E1'}))
    fireEvent.click(screen.getByRole('button', {name: 'T1'}))

    expect(onOpenReferenceName).toHaveBeenNthCalledWith(1, 'First Bloom', expect.anything())
    expect(onOpenReferenceName).toHaveBeenNthCalledWith(2, 'Base Talent', expect.anything())
  })

  it('renders non-openable badges as text when no open target is available', () => {
    render(
      <AwakenerEnlightenInfluenceBadges
        influenceBadges={[
          {
            kind: 'enlighten',
            id: 'enlighten.e1',
            label: 'E1',
            referenceName: 'First Bloom',
            slot: 'E1',
          },
        ]}
        selectedEnlightenSlot={null}
      />,
    )

    expect(screen.queryByRole('button', {name: 'E1'})).not.toBeInTheDocument()
    expect(screen.getByText('E1')).toHaveAttribute('title', 'Left-click: open E1 details')
  })
})
