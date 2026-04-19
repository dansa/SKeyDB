import {useCallback} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {type AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import {type DatabaseAwakenerTab} from '@/domain/database-paths'
import type {Wheel} from '@/domain/wheels'

import {useAwakenerDetailChrome} from './useAwakenerDetailChrome'
import {useAwakenerDetailDatabaseState} from './useAwakenerDetailDatabaseState'
import {useAwakenerDetailSearch} from './useAwakenerDetailSearch'
import {useDatabaseDetailModalLifecycle} from './useDatabaseDetailModalLifecycle'
import {useDatabasePopoverController} from './useDatabasePopoverController'

interface UseAwakenerDetailModalStateOptions {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  fullDataV2: AwakenerFullV2Record
  onClose: () => void
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export function useAwakenerDetailModalState({
  activeTab,
  awakener,
  awakeners,
  fullDataV2,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  onTabChange,
}: UseAwakenerDetailModalStateOptions) {
  const search = useAwakenerDetailSearch({activeTab, awakeners, onSelectAwakener})
  const databaseState = useAwakenerDetailDatabaseState({fullDataV2})
  const {
    actions: sessionActions,
    preferences: sessionPreferences,
    runtime: sessionRuntime,
  } = databaseState
  const {defaultSelection, fontScale, value: preferences} = sessionPreferences
  const {referenceLayer, resolvedControls, resolvedSelection, resolvedStats, shellView} =
    sessionRuntime

  const setActiveTab = useCallback(
    (nextTab: DatabaseAwakenerTab) => {
      onTabChange(nextTab)
    },
    [onTabChange],
  )

  const navigateToCards = useCallback(() => {
    setActiveTab('cards')
  }, [setActiveTab])

  const popoverController = useDatabasePopoverController({
    onNavigateToCards: navigateToCards,
    onNavigateToWheelPage: onSelectWheel,
    onToggleEnlightenSlot: sessionActions.toggleEnlightenSlot,
    referenceLayer,
    selectedEnlightenSlot: resolvedSelection.selectedEnlightenSlot,
    showTagIcons: preferences.showTagIcons,
    showVisibleScaling: preferences.showVisibleScaling,
    stats: shellView.stats,
  })
  const {
    hasOpenPopovers,
    closeAllPopovers,
    contextValue: popoverContextValue,
    popoverRootProps,
  } = popoverController

  const chrome = useAwakenerDetailChrome({
    awakenerId: awakener.id,
    awakenerTags: awakener.tags,
    clickOutsideClosesPopovers: preferences.clickOutsideClosesPopovers,
    closeAllPopovers,
    closeSearch: search.closeSearch,
    hasOpenPopovers,
    isSearchOpen: search.isSearchOpen,
    onClose,
    searchContainerRef: search.searchContainerRef,
    searchInputRef: search.searchInputRef,
  })
  const {clearSearch, closeSearch, searchInputRef, searchQuery} = search
  const {isSettingsOpen, setIsSettingsOpen} = chrome

  useDatabaseDetailModalLifecycle({
    clearSearch,
    closeAllPopovers,
    closeSearch,
    dismissSettings: () => {
      setIsSettingsOpen(false)
    },
    hasOpenPopovers,
    isSettingsOpen,
    onClose,
    searchInputRef,
    searchQuery,
  })

  return {
    activeSearchIndex: search.activeSearchIndex,
    activeTab,
    canExpandTags: chrome.canExpandTags,
    defaultSelection,
    fontScale,
    handleOverlayClick: chrome.handleOverlayClick,
    handlePanelKeyDown: chrome.handlePanelKeyDown,
    handleSearchInputKeyDown: search.handleSearchInputKeyDown,
    handleSearchQueryChange: search.handleSearchQueryChange,
    handleSelectAwakenerFromSearch: search.handleSelectAwakenerFromSearch,
    isMobileHeader: chrome.isMobileHeader,
    isSearchOpen: search.isSearchOpen,
    isSettingsOpen: chrome.isSettingsOpen,
    openSearch: search.openSearch,
    panelRef: chrome.panelRef,
    popoverContextValue,
    popoverRootProps,
    preferences,
    referenceLayer,
    resolvedControls,
    resolvedSelection,
    resolvedStats,
    searchContainerRef: search.searchContainerRef,
    searchInputRef: search.searchInputRef,
    searchQuery: search.searchQuery,
    searchResults: search.searchResults,
    setActiveTab,
    setIsSettingsOpen: chrome.setIsSettingsOpen,
    setShowAllTags: chrome.setShowAllTags,
    session: {
      actions: sessionActions,
      preferences: sessionPreferences,
      runtime: sessionRuntime,
    },
    settingsRef: chrome.settingsRef,
    showAllTags: chrome.showAllTags,
    tagsRef: chrome.tagsRef,
  }
}
