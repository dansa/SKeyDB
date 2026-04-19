import {useCallback, useMemo, useState} from 'react'

import {clampWheelEnhanceLevel, resolveWheelDescriptionRank} from '@/domain/wheel-enhance'
import {resolveWheelMainstatValue} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import {
  buildWheelDatabaseDescriptionRecord,
  buildWheelDatabaseReferenceLayer,
} from '@/domain/wheels-database-reference-layer'
import type {WheelFullV1Record} from '@/domain/wheels-full-v1'

import {useDatabaseDetailChrome} from './useDatabaseDetailChrome'
import {useDatabaseDetailModalLifecycle} from './useDatabaseDetailModalLifecycle'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {useWheelDetailSearch} from './useWheelDetailSearch'

interface UseWheelDetailModalStateOptions {
  wheel: Wheel
  wheels: Wheel[]
  fullDataV1: WheelFullV1Record
  onClose: () => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

export function useWheelDetailModalState({
  wheel,
  wheels,
  fullDataV1,
  onClose,
  onSelectWheel,
}: UseWheelDetailModalStateOptions) {
  const {preferences, updateSharedPreferences, updateWheelPreferences} =
    useDatabaseDetailPreferences()
  const [enhanceLevel, setEnhanceLevelState] = useState(preferences.wheel.defaultEnhanceLevel)
  const descriptionRank = useMemo(() => resolveWheelDescriptionRank(enhanceLevel), [enhanceLevel])
  const search = useWheelDetailSearch({
    onSelectWheel,
    wheels,
  })
  const referenceLayer = useMemo(
    () =>
      buildWheelDatabaseReferenceLayer({
        activeDescriptionRank: descriptionRank,
        activeWheelId: fullDataV1.id,
      }),
    [descriptionRank, fullDataV1.id],
  )
  const popoverController = useDatabasePopoverController({
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const {closeAllPopovers, contextValue, hasOpenPopovers, popoverRootProps} = popoverController
  const chrome = useDatabaseDetailChrome({
    clickOutsideClosesPopovers: preferences.shared.clickOutsideClosesPopovers,
    closeAllPopovers,
    closeSearch: search.closeSearch,
    hasOpenPopovers,
    isSearchOpen: search.isSearchOpen,
    onClose,
    searchContainerRef: search.searchContainerRef,
    searchInputRef: search.searchInputRef,
  })

  const setEnhanceLevel = useCallback((level: number) => {
    setEnhanceLevelState(clampWheelEnhanceLevel(level))
  }, [])

  const wheelDescriptionRecord = useMemo(
    () => buildWheelDatabaseDescriptionRecord(fullDataV1),
    [fullDataV1],
  )
  const resolvedMainstatValue = useMemo(
    () => resolveWheelMainstatValue(fullDataV1.mainstatSeriesKey, enhanceLevel),
    [enhanceLevel, fullDataV1.mainstatSeriesKey],
  )

  useDatabaseDetailModalLifecycle({
    clearSearch: search.clearSearch,
    closeAllPopovers,
    closeSearch: search.closeSearch,
    dismissSettings: () => {
      chrome.setIsSettingsOpen(false)
    },
    hasOpenPopovers,
    isSettingsOpen: chrome.isSettingsOpen,
    onClose,
    searchInputRef: search.searchInputRef,
    searchQuery: search.searchQuery,
  })

  return {
    enhanceLevel,
    descriptionRank,
    preferences,
    popoverContextValue: contextValue,
    popoverRootProps,
    referenceLayer,
    resolvedMainstatValue,
    search,
    setEnhanceLevel,
    updateSharedPreferences,
    updateWheelPreferences,
    wheel,
    wheelDescriptionRecord,
    chrome,
  }
}
