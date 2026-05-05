import {useMemo} from 'react'

import {act, render, renderHook, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {PopoverTrailPanel} from './PopoverTrailPanel'
import {useDetailEntitySearch, useSuppressDetailEntitySearchCapture} from './useDetailEntitySearch'

function dispatchKey(key: string) {
  const event = new KeyboardEvent('keydown', {bubbles: true, key})
  window.dispatchEvent(event)
}

describe('useDetailEntitySearch', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

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
      const anchorRect = useMemo(() => new DOMRect(24, 24, 48, 24), [])

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

  it('keeps global typing capture suppressed until every nested suppressor unmounts', () => {
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'beta'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )

    function SearchSuppressor() {
      useSuppressDetailEntitySearchCapture()
      return null
    }

    const firstSuppressor = render(<SearchSuppressor />)
    const secondSuppressor = render(<SearchSuppressor />)

    act(() => {
      dispatchKey('a')
    })
    expect(result.current.searchQuery).toBe('')

    firstSuppressor.unmount()

    act(() => {
      dispatchKey('b')
    })
    expect(result.current.searchQuery).toBe('')

    secondSuppressor.unmount()

    act(() => {
      dispatchKey('c')
    })
    expect(result.current.searchQuery).toBe('c')
  })

  it('does not re-register the global keydown listener for each search query change', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'beta'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))

    act(() => {
      result.current.handleSearchQueryChange('a')
    })
    act(() => {
      result.current.handleSearchQueryChange('al')
    })
    act(() => {
      dispatchKey('p')
    })

    expect(result.current.searchQuery).toBe('alp')
    expect(addEventListenerSpy).toHaveBeenCalledTimes(1)
    expect(removeEventListenerSpy).not.toHaveBeenCalled()
  })
})
