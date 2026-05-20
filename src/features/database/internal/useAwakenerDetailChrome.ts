import {type RefObject} from 'react'

import {useDetailModalChrome} from '@/ui/modal/useDetailModalChrome'

interface UseAwakenerDetailChromeOptions {
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
  isSearchOpen,
  searchContainerRef,
  searchInputRef,
  closeSearch,
  hasOpenPopovers,
  closeAllPopovers,
  clickOutsideClosesPopovers,
  onClose,
}: UseAwakenerDetailChromeOptions) {
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

  return {
    handleOverlayClick: chrome.handleOverlayClick,
    handlePanelKeyDown: chrome.handlePanelKeyDown,
    isMobileHeader: chrome.isMobileHeader,
    isSettingsOpen: chrome.isSettingsOpen,
    panelRef: chrome.panelRef,
    setIsSettingsOpen: chrome.setIsSettingsOpen,
    settingsRef: chrome.settingsRef,
  }
}
