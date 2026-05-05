import {useCallback, useEffect, useRef, useState, type RefObject, type SetStateAction} from 'react'

import {useDetailModalChrome} from '@/ui/modal/useDetailModalChrome'

const MOBILE_TAG_ROWS_HEIGHT = 46

interface UseAwakenerDetailChromeOptions {
  awakenerId: string
  awakenerTags: readonly string[]
  isSearchOpen: boolean
  searchContainerRef: RefObject<HTMLDivElement | null>
  searchInputRef: RefObject<HTMLInputElement | null>
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
  searchInputRef,
  closeSearch,
  hasOpenPopovers,
  closeAllPopovers,
  clickOutsideClosesPopovers,
  onClose,
}: UseAwakenerDetailChromeOptions) {
  const [expandedAwakenerId, setExpandedAwakenerId] = useState<string | null>(null)
  const [canExpandTags, setCanExpandTags] = useState(false)
  const tagsRef = useRef<HTMLDivElement>(null)
  const showAllTags = expandedAwakenerId === awakenerId
  const setShowAllTags = useCallback(
    (next: SetStateAction<boolean>) => {
      const nextValue = typeof next === 'function' ? next(showAllTags) : next
      setExpandedAwakenerId(nextValue ? awakenerId : null)
    },
    [awakenerId, showAllTags],
  )
  const chrome = useDetailModalChrome({
    clickOutsideClosesPopovers,
    closeAllPopovers,
    closeSearch,
    hasOpenPopovers,
    isSearchOpen,
    onClose,
    searchContainerRef,
    searchInputRef,
  })

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

  return {
    canExpandTags,
    handleOverlayClick: chrome.handleOverlayClick,
    handlePanelKeyDown: chrome.handlePanelKeyDown,
    isMobileHeader: chrome.isMobileHeader,
    isSettingsOpen: chrome.isSettingsOpen,
    panelRef: chrome.panelRef,
    setIsSettingsOpen: chrome.setIsSettingsOpen,
    setShowAllTags,
    settingsRef: chrome.settingsRef,
    showAllTags,
    tagsRef,
  }
}
