import {useMemo} from 'react'

import {act, render, renderHook, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {PopoverTrailPanel} from './PopoverTrailPanel'
import {
  useDetailEntitySearch,
  useSuppressDetailEntitySearchCapture,
} from './useDetailEntitySearch'

function dispatchKey(key: string) {
  const event = new KeyboardEvent('keydown', {bubbles: true, key})
  window.dispatchEvent(event)
}

describe('useDetailEntitySearch', () => {
  it('suppresses global typing capture while a nested popover trail surface owns focus', () => {
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'beta'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )

    function SearchSuppressedPopover() {
      useSuppressDetailEntitySearchCapture()
      const anchorRect = useMemo(
        () => new DOMRect(24, 24, 48, 24),
        [],
      )

      return (
        <PopoverTrailPanel anchorRect={anchorRect} itemCount={1} onCloseAll={vi.fn()}>
          <button type='button'>Nested popover action</button>
        </PopoverTrailPanel>
      )
    }

    render(<SearchSuppressedPopover />)

    const closeAllButton = screen.getByRole('button', {name: 'Close all'})
    closeAllButton.focus()

    act(() => {
      dispatchKey('b')
    })

    expect(result.current.searchQuery).toBe('')
    expect(closeAllButton).toHaveFocus()
  })
})
