import {useCallback, useEffect, type RefObject} from 'react'

interface UseDetailModalLifecycleOptions {
  clearSearch: () => void
  closeAllPopovers: () => void
  closeTopPopover?: () => void
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
  closeTopPopover,
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
        if (closeTopPopover) {
          closeTopPopover()
        } else {
          closeAllPopovers()
        }
        return
      }

      consumeEvent()
      onClose()
    },
    [
      clearSearch,
      closeAllPopovers,
      closeTopPopover,
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
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      handleEscapeDismissal(event)
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [handleEscapeDismissal])

  return handleEscapeDismissal
}
