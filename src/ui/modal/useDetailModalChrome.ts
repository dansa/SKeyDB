import {useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject} from 'react'

import {getFocusableElements} from './focus-scope'
import {acquirePageScrollLock, releasePageScrollLock} from './pageScrollLock'

interface UseDetailModalChromeOptions {
  isSearchOpen: boolean
  searchContainerRef?: RefObject<HTMLElement | null>
  searchInputRef?: RefObject<HTMLInputElement | null>
  closeSearch?: (blurInput?: boolean) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
  clickOutsideClosesPopovers: boolean
  onClose: () => void
}

interface ModalKeyDownEvent {
  currentTarget: EventTarget | null
  key: string
  preventDefault: () => void
  shiftKey: boolean
}

interface ModalOverlayClickEvent {
  target: EventTarget | null
}

export function useDetailModalChrome({
  clickOutsideClosesPopovers,
  closeAllPopovers,
  closeSearch,
  hasOpenPopovers,
  isSearchOpen,
  onClose,
  searchContainerRef,
  searchInputRef,
}: UseDetailModalChromeOptions) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const isMobileHeader = useSyncExternalStore(
    subscribeToModalHeaderViewport,
    getModalHeaderViewportSnapshot,
    getServerModalHeaderViewportSnapshot,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const lockToken = acquirePageScrollLock()

    return () => {
      releasePageScrollLock(lockToken)
    }
  }, [])

  useEffect(() => {
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    searchInputRef?.current?.focus()

    return () => {
      previouslyFocusedElementRef.current?.focus()
    }
  }, [searchInputRef])

  useEffect(() => {
    if (!isSettingsOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (settingsRef.current?.contains(target)) {
        return
      }
      if (target.closest('[data-detail-settings-trigger]')) {
        return
      }
      setIsSettingsOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isSettingsOpen])

  const handleOverlayClick = useCallback(
    (event: ModalOverlayClickEvent) => {
      if (!(event.target instanceof HTMLElement)) {
        return
      }

      const target = event.target
      const clickedOutsideSearch = !searchContainerRef?.current?.contains(target)
      if (isSearchOpen && clickedOutsideSearch && closeSearch) {
        closeSearch(true)
        return
      }

      const clickedInsidePopover = Boolean(target.closest('[data-skill-popover]'))
      const clickedInsidePopoverPreservingControl = Boolean(
        target.closest('[data-detail-modal-popover-preserve]'),
      )
      if (
        hasOpenPopovers &&
        clickOutsideClosesPopovers &&
        !clickedInsidePopover &&
        !clickedInsidePopoverPreservingControl &&
        !target.closest('[data-detail-modal-external]')
      ) {
        closeAllPopovers()
        return
      }

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !clickedInsidePopover &&
        !target.closest('[data-detail-modal-external]')
      ) {
        onClose()
      }
    },
    [
      clickOutsideClosesPopovers,
      closeAllPopovers,
      closeSearch,
      hasOpenPopovers,
      isSearchOpen,
      onClose,
      searchContainerRef,
    ],
  )

  const handlePanelKeyDown = useCallback((event: ModalKeyDownEvent) => {
    if (event.key !== 'Tab') {
      return
    }

    if (!(event.currentTarget instanceof HTMLElement)) {
      return
    }

    const focusScope = event.currentTarget
    const focusableElements = getFocusableElements(focusScope)
    if (focusableElements.length === 0) {
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    if (event.shiftKey) {
      if (!activeElement || activeElement === firstElement || activeElement === panelRef.current) {
        event.preventDefault()
        lastElement.focus()
      }
      return
    }

    if (!activeElement || activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }, [])

  return {
    handleOverlayClick,
    handlePanelKeyDown,
    isMobileHeader,
    isSettingsOpen,
    panelRef,
    setIsSettingsOpen,
    settingsRef,
  }
}

function subscribeToModalHeaderViewport(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener('resize', onStoreChange)
  return () => {
    window.removeEventListener('resize', onStoreChange)
  }
}

function getModalHeaderViewportSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return getServerModalHeaderViewportSnapshot()
  }

  return window.innerWidth < 768
}

function getServerModalHeaderViewportSnapshot(): boolean {
  return false
}
