import {fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {BuilderSelectionControls} from './BuilderSelectionControls'

afterEach(() => {
  window.localStorage.removeItem('skeydb.builder.awakenerSortExpanded.v1')
})

describe('builder sorting toggle accessibility', () => {
  it('names all sorting toggles and exposes state and activation', () => {
    window.localStorage.setItem('skeydb.builder.awakenerSortExpanded.v1', '1')
    const onUnusedFirstChange = vi.fn()
    const props = {
      pickerTab: 'wheels' as const,
      awakenerSortKey: 'LEVEL' as const,
      awakenerSortDirection: 'DESC' as const,
      awakenerSortGroupByRealm: false,
      displayUnowned: true,
      sinkUnownedToBottom: false,
      unusedFirst: false,
      allowDupes: false,
      promoteRecommendedGear: true,
      promoteMatchingWheelMainstats: false,
      onAwakenerSortKeyChange: vi.fn(),
      onAwakenerSortDirectionToggle: vi.fn(),
      onAwakenerSortGroupByRealmChange: vi.fn(),
      onDisplayUnownedChange: vi.fn(),
      onSinkUnownedToBottomChange: vi.fn(),
      onUnusedFirstChange,
      onAllowDupesChange: vi.fn(),
      onPromoteRecommendedGearChange: vi.fn(),
      onPromoteMatchingWheelMainstatsChange: vi.fn(),
    }
    const {rerender} = render(<BuilderSelectionControls {...props} />)
    for (const [name, pressed] of [
      ['Display unowned', true],
      ['Move unowned to bottom', false],
      ['Unused first', false],
      ['Allow dupes', false],
      ['Promote recommendations', true],
      ['Promote mainstat matches', false],
    ] as const) {
      expect(screen.getByRole('button', {name, pressed})).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', {name: 'Unused first'}))
    expect(onUnusedFirstChange).toHaveBeenCalledWith(true)
    rerender(<BuilderSelectionControls {...props} unusedFirst />)
    expect(screen.getByRole('button', {name: 'Unused first', pressed: true})).toBeInTheDocument()
    rerender(<BuilderSelectionControls {...props} pickerTab='awakeners' />)
    expect(
      screen.getByRole('button', {name: 'Toggle grouping by realm', pressed: false}),
    ).toBeInTheDocument()
  })
})
