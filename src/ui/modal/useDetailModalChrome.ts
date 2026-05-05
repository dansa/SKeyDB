import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react'

import {getFocusableElements} from './focus-scope'

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
  const [isMobileHeader, setIsMobileHeader] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
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
    function updateHeaderLayout() {
      setIsMobileHeader(window.innerWidth < 768)
    }

    updateHeaderLayout()
    window.addEventListener('resize', updateHeaderLayout)
    return () => {
      window.removeEventListener('resize', updateHeaderLayout)
    }
  }, [])

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
    (event: ReactMouseEvent) => {
      const target = event.target as HTMLElement
      const clickedOutsideSearch = !searchContainerRef?.current?.contains(target)
      if (isSearchOpen && clickedOutsideSearch && closeSearch) {
        closeSearch(true)
        return
      }

      const clickedInsidePopover = Boolean(target.closest('[data-skill-popover]'))
      if (
        hasOpenPopovers &&
        clickOutsideClosesPopovers &&
        !clickedInsidePopover &&
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

  const handlePanelKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') {
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
