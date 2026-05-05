import {useEffect, type RefObject} from 'react'

interface UseDetailModalLifecycleOptions {
  clearSearch: () => void
  closeAllPopovers: () => void
  closeSearch: (blurInput?: boolean) => void
  hasOpenPopovers: boolean
  onClose: () => void
  searchInputRef: RefObject<HTMLInputElement | null>
  searchQuery: string
  dismissSettings?: () => void
  isSettingsOpen?: boolean
}

export function useDetailModalLifecycle({
  clearSearch,
  closeAllPopovers,
  closeSearch,
  dismissSettings,
  hasOpenPopovers,
  isSettingsOpen = false,
  onClose,
  searchInputRef,
  searchQuery,
}: UseDetailModalLifecycleOptions) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      const searchIsFocused = document.activeElement === searchInputRef.current
      const hasSearchQuery = searchQuery.trim().length > 0
      if (searchIsFocused || hasSearchQuery) {
        event.preventDefault()
        event.stopPropagation()

        if (hasSearchQuery) {
          clearSearch()
          return
        }

        closeSearch(true)
        return
      }

      if (isSettingsOpen && dismissSettings) {
        event.preventDefault()
        event.stopPropagation()
        dismissSettings()
        return
      }

      if (hasOpenPopovers) {
        event.preventDefault()
        event.stopPropagation()
        closeAllPopovers()
        return
      }

      onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [
    clearSearch,
    closeAllPopovers,
    closeSearch,
    dismissSettings,
    hasOpenPopovers,
    isSettingsOpen,
    onClose,
    searchInputRef,
    searchQuery,
  ])
}
