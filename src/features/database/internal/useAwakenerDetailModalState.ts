import {useCallback} from 'react'

import {type Awakener} from '@/domain/awakeners'
import {type AwakenerFullRecord} from '@/domain/awakeners-full'
import type {Covenant} from '@/domain/covenants'
import {type DatabaseAwakenerTab} from '@/domain/database-paths'
import type {Wheel} from '@/domain/wheels'
import {useDetailModalLifecycle} from '@/ui/modal/useDetailModalLifecycle'

import {useAwakenerDetailChrome} from './useAwakenerDetailChrome'
import {useAwakenerDetailDatabaseState} from './useAwakenerDetailDatabaseState'
import {useAwakenerDetailSearch} from './useAwakenerDetailSearch'
import {useDatabasePopoverController} from './useDatabasePopoverController'

interface UseAwakenerDetailModalStateOptions {
  activeTab: DatabaseAwakenerTab
  awakeners: Awakener[]
  fullData: AwakenerFullRecord
  onClose: () => void
  onSelectAwakener?: (awakener: Awakener, tab: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'id' | 'name'>) => void
  onSelectCovenant?: (covenant: Pick<Covenant, 'id' | 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export function useAwakenerDetailModalState({
  activeTab,
  awakeners,
  fullData,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  onSelectCovenant,
  onTabChange,
}: UseAwakenerDetailModalStateOptions) {
  const search = useAwakenerDetailSearch({activeTab, awakeners, onSelectAwakener})
  const databaseState = useAwakenerDetailDatabaseState({fullData})
  const {
    actions: sessionActions,
    preferences: sessionPreferences,
    runtime: sessionRuntime,
  } = databaseState
  const {referenceLayer, resolvedControls, resolvedSelection, resolvedStats, shellView} =
    sessionRuntime

  const setActiveTab = useCallback(
    (nextTab: DatabaseAwakenerTab) => {
      onTabChange(nextTab)
    },
    [onTabChange],
  )

  const navigateToSkills = useCallback(() => {
    setActiveTab('skills')
  }, [setActiveTab])

  const popoverController = useDatabasePopoverController({
    formulaContext: shellView.formulaContext,
    onNavigateToSkills: navigateToSkills,
    onNavigateToCovenantPage: onSelectCovenant,
    onNavigateToWheelPage: onSelectWheel,
    onToggleEnlightenSlot: sessionActions.toggleEnlightenSlot,
    referenceLayer,
    selectedEnlightenSlot: resolvedSelection.selectedEnlightenSlot,
    showTagIcons: sessionPreferences.shared.showTagIcons,
    showVisibleScaling: sessionPreferences.awakener.showVisibleScaling,
    stats: shellView.stats,
  })
  const {
    hasOpenPopovers,
    closeAllPopovers,
    contextValue: popoverContextValue,
    popoverRootProps,
  } = popoverController

  const chrome = useAwakenerDetailChrome({
    clickOutsideClosesPopovers: sessionPreferences.shared.clickOutsideClosesPopovers,
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

  useDetailModalLifecycle({
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
    fontScale: sessionPreferences.shared.fontScale,
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
    preferences: sessionPreferences,
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
    session: {
      actions: sessionActions,
      preferences: sessionPreferences,
      runtime: sessionRuntime,
    },
    settingsRef: chrome.settingsRef,
  }
}
