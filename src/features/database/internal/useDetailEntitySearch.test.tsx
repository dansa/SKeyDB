import {useMemo, type KeyboardEvent as ReactKeyboardEvent} from 'react'

import {act, render, renderHook, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {PopoverTrailPanel} from './PopoverTrailPanel'
import {useDetailEntitySearch, useSuppressDetailEntitySearchCapture} from './useDetailEntitySearch'

function dispatchKey(key: string) {
  const event = new KeyboardEvent('keydown', {bubbles: true, key})
  window.dispatchEvent(event)
}

function inputKeyDown(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as ReactKeyboardEvent<HTMLInputElement>
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

  it('resets the active result and opens search when the query changes', () => {
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'alpine', 'beta'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )

    act(() => {
      result.current.handleSearchQueryChange('a')
    })
    act(() => {
      result.current.handleSearchInputKeyDown(inputKeyDown('ArrowDown'))
    })
    expect(result.current.activeSearchIndex).toBe(1)

    act(() => {
      result.current.handleSearchQueryChange('al')
    })

    expect(result.current.isSearchOpen).toBe(true)
    expect(result.current.activeSearchIndex).toBe(0)
  })

  it('wraps active result navigation with ArrowDown and ArrowUp', () => {
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'alpine'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )

    act(() => {
      result.current.handleSearchQueryChange('al')
    })
    act(() => {
      result.current.handleSearchInputKeyDown(inputKeyDown('ArrowUp'))
    })
    expect(result.current.activeSearchIndex).toBe(1)

    act(() => {
      result.current.handleSearchInputKeyDown(inputKeyDown('ArrowDown'))
    })
    expect(result.current.activeSearchIndex).toBe(0)
  })

  it('selects the active result, clears search, and blurs the input', () => {
    const onSelectResult = vi.fn()
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha', 'alpine'],
        onSelectResult,
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )
    const input = document.createElement('input')
    result.current.searchInputRef.current = input
    document.body.append(input)
    input.focus()

    act(() => {
      result.current.handleSearchQueryChange('al')
    })
    act(() => {
      result.current.handleSearchInputKeyDown(inputKeyDown('ArrowDown'))
    })
    act(() => {
      result.current.handleSearchInputKeyDown(inputKeyDown('Enter'))
    })

    expect(onSelectResult).toHaveBeenCalledWith('alpine')
    expect(result.current.searchQuery).toBe('')
    expect(result.current.isSearchOpen).toBe(false)
    expect(result.current.activeSearchIndex).toBe(0)
    expect(input).not.toHaveFocus()
    input.remove()
  })

  it('optionally blurs the search input when closing search', () => {
    const {result} = renderHook(() =>
      useDetailEntitySearch({
        items: ['alpha'],
        onSelectResult: vi.fn(),
        searchItems: (items, query) => items.filter((item) => item.includes(query)),
      }),
    )
    const input = document.createElement('input')
    result.current.searchInputRef.current = input
    document.body.append(input)
    input.focus()

    act(() => {
      result.current.openSearch()
    })
    act(() => {
      result.current.closeSearch()
    })
    expect(input).toHaveFocus()

    act(() => {
      result.current.openSearch()
    })
    act(() => {
      result.current.closeSearch(true)
    })
    expect(result.current.isSearchOpen).toBe(false)
    expect(input).not.toHaveFocus()
    input.remove()
  })
})
