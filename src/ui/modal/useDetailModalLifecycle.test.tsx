import {createRef} from 'react'

import {act, renderHook} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {useDetailModalLifecycle} from './useDetailModalLifecycle'

function dispatchEscape() {
  const event = new KeyboardEvent('keydown', {bubbles: true, key: 'Escape'})
  window.dispatchEvent(event)
}

describe('useDetailModalLifecycle', () => {
  it('clears search before dismissing settings, then popovers, then closes the modal', () => {
    const clearSearch = vi.fn()
    const closeSearch = vi.fn()
    const closeAllPopovers = vi.fn()
    const dismissSettings = vi.fn()
    const onClose = vi.fn()
    const searchInputRef = createRef<HTMLInputElement>()

    renderHook(() => {
      useDetailModalLifecycle({
        clearSearch,
        closeAllPopovers,
        closeSearch,
        dismissSettings,
        hasOpenPopovers: true,
        isSettingsOpen: true,
        onClose,
        searchInputRef,
        searchQuery: 'beta',
      })
    })

    act(() => {
      dispatchEscape()
    })

    expect(clearSearch).toHaveBeenCalledTimes(1)
    expect(dismissSettings).not.toHaveBeenCalled()
    expect(closeAllPopovers).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes the empty search UI before dismissing settings and popovers', () => {
    const closeSearch = vi.fn()
    const dismissSettings = vi.fn()
    const closeAllPopovers = vi.fn()
    const onClose = vi.fn()
    const searchInput = document.createElement('input')
    document.body.appendChild(searchInput)
    searchInput.focus()
    const searchInputRef = {current: searchInput}

    try {
      renderHook(() => {
        useDetailModalLifecycle({
          clearSearch: vi.fn(),
          closeAllPopovers,
          closeSearch,
          dismissSettings,
          hasOpenPopovers: true,
          isSettingsOpen: true,
          onClose,
          searchInputRef,
          searchQuery: '',
        })
      })

      act(() => {
        dispatchEscape()
      })

      expect(closeSearch).toHaveBeenCalledWith(true)
      expect(dismissSettings).not.toHaveBeenCalled()
      expect(closeAllPopovers).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    } finally {
      searchInput.remove()
    }
  })

  it('falls through to settings, then popovers, then modal close when search is inactive', () => {
    const closeAllPopovers = vi.fn()
    const dismissSettings = vi.fn()
    const onClose = vi.fn()

    const {rerender} = renderHook(
      ({hasOpenPopovers, isSettingsOpen}: {hasOpenPopovers: boolean; isSettingsOpen: boolean}) => {
        useDetailModalLifecycle({
          clearSearch: vi.fn(),
          closeAllPopovers,
          closeSearch: vi.fn(),
          dismissSettings,
          hasOpenPopovers,
          isSettingsOpen,
          onClose,
          searchInputRef: createRef<HTMLInputElement>(),
          searchQuery: '',
        })
      },
      {
        initialProps: {
          hasOpenPopovers: true,
          isSettingsOpen: true,
        },
      },
    )

    act(() => {
      dispatchEscape()
    })
    expect(dismissSettings).toHaveBeenCalledTimes(1)
    expect(closeAllPopovers).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()

    rerender({
      hasOpenPopovers: true,
      isSettingsOpen: false,
    })

    act(() => {
      dispatchEscape()
    })
    expect(closeAllPopovers).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    rerender({
      hasOpenPopovers: false,
      isSettingsOpen: false,
    })

    act(() => {
      dispatchEscape()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
