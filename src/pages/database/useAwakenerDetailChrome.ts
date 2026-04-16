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

const MOBILE_TAG_ROWS_HEIGHT = 46

interface UseAwakenerDetailChromeOptions {
  awakenerId: number
  awakenerTags: readonly string[]
  isSearchOpen: boolean
  searchContainerRef: RefObject<HTMLDivElement | null>
  closeSearch: (blurInput?: boolean) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
  clickOutsideClosesPopovers: boolean
  onClose: () => void
}

export function useAwakenerDetailChrome({
  awakenerId,
  awakenerTags,
  isSearchOpen,
  searchContainerRef,
  closeSearch,
  hasOpenPopovers,
  closeAllPopovers,
  clickOutsideClosesPopovers,
  onClose,
}: UseAwakenerDetailChromeOptions) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [canExpandTags, setCanExpandTags] = useState(false)
  const [isMobileHeader, setIsMobileHeader] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const tagsRef = useRef<HTMLDivElement>(null)
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
    panelRef.current?.focus()

    return () => {
      previouslyFocusedElementRef.current?.focus()
    }
  }, [])

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
    function refreshTagsOverflow() {
      const element = tagsRef.current
      if (!element) {
        setCanExpandTags(false)
        return
      }
      setCanExpandTags(element.scrollHeight > MOBILE_TAG_ROWS_HEIGHT + 1)
    }

    refreshTagsOverflow()
    window.addEventListener('resize', refreshTagsOverflow)
    return () => {
      window.removeEventListener('resize', refreshTagsOverflow)
    }
  }, [awakenerId, awakenerTags])

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
      const clickedOutsideSearch = !searchContainerRef.current?.contains(target)
      if (isSearchOpen && clickedOutsideSearch) {
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
      event.preventDefault()
      panelRef.current?.focus()
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
    canExpandTags,
    handleOverlayClick,
    handlePanelKeyDown,
    isMobileHeader,
    isSettingsOpen,
    panelRef,
    setIsSettingsOpen,
    setShowAllTags,
    settingsRef,
    showAllTags,
    tagsRef,
  }
}
