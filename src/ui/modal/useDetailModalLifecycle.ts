import {useCallback, useEffect, type RefObject} from 'react'

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

interface ModalDismissEvent {
  preventDefault: () => void
  stopPropagation: () => void
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
  const handleEscapeDismissal = useCallback(
    (event?: ModalDismissEvent) => {
      const consumeEvent = () => {
        event?.preventDefault()
        event?.stopPropagation()
      }

      const searchIsFocused = document.activeElement === searchInputRef.current
      const hasSearchQuery = searchQuery.trim().length > 0
      if (searchIsFocused || hasSearchQuery) {
        consumeEvent()

        if (hasSearchQuery) {
          clearSearch()
          return
        }

        closeSearch(true)
        return
      }

      if (isSettingsOpen && dismissSettings) {
        consumeEvent()
        dismissSettings()
        return
      }

      if (hasOpenPopovers) {
        consumeEvent()
        closeAllPopovers()
        return
      }

      consumeEvent()
      onClose()
    },
    [
      clearSearch,
      closeAllPopovers,
      closeSearch,
      dismissSettings,
      hasOpenPopovers,
      isSettingsOpen,
      onClose,
      searchInputRef,
      searchQuery,
    ],
  )

  useEffect(() => {
    function handleWindowEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handleEscapeDismissal(event)
      }
    }

    window.addEventListener('keydown', handleWindowEscape)
    return () => {
      window.removeEventListener('keydown', handleWindowEscape)
    }
  }, [handleEscapeDismissal])

  return handleEscapeDismissal
}
