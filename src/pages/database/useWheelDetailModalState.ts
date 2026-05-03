import {useCallback, useMemo, useState} from 'react'

import {loadCollectionOwnership} from '@/domain/collection-ownership'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {getBrowserLocalStorage} from '@/domain/storage'
import {clampWheelEnhanceLevel, resolveWheelDescriptionRank} from '@/domain/wheel-enhance'
import {resolveWheelMainstatValue} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import {
  buildWheelDatabaseDescriptionRecord,
  buildWheelDatabaseReferenceLayer,
} from '@/domain/wheels-database-reference-layer'
import type {WheelFullV2Record} from '@/domain/wheels-full-v2'

import {useDatabaseDetailChrome} from './useDatabaseDetailChrome'
import {useDatabaseDetailModalLifecycle} from './useDatabaseDetailModalLifecycle'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {useWheelDetailSearch} from './useWheelDetailSearch'

interface UseWheelDetailModalStateOptions {
  wheel: Wheel
  wheels: Wheel[]
  fullDataV2: WheelFullV2Record
  onClose: () => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

export function useWheelDetailModalState({
  wheel,
  wheels,
  fullDataV2,
  onClose,
  onSelectWheel,
}: UseWheelDetailModalStateOptions) {
  const {preferences, updateSharedPreferences, updateWheelPreferences} =
    useDatabaseDetailPreferences()
  const [collectionOwnership] = useState(() => loadCollectionOwnership(getBrowserLocalStorage()))
  const [enhanceLevel, setEnhanceLevelState] = useState(preferences.wheel.defaultEnhanceLevel)
  const descriptionRank = useMemo(() => resolveWheelDescriptionRank(enhanceLevel), [enhanceLevel])
  const search = useWheelDetailSearch({
    onSelectWheel,
    wheels,
  })
  const formulaContext = useMemo(
    () =>
      buildPublicFormulaContext({
        accountLevel: preferences.shared.accountLevel,
        collectionOwnership,
        wheelEnhanceLevel: enhanceLevel,
      }),
    [collectionOwnership, enhanceLevel, preferences.shared.accountLevel],
  )
  const referenceLayer = useMemo(
    () =>
      buildWheelDatabaseReferenceLayer({
        activeDescriptionRank: descriptionRank,
        activeWheelId: fullDataV2.id,
        formulaContext,
        wheelRecords: [fullDataV2],
      }),
    [descriptionRank, formulaContext, fullDataV2],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
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
    () => buildWheelDatabaseDescriptionRecord(fullDataV2),
    [fullDataV2],
  )
  const resolvedMainstatValue = useMemo(
    () => resolveWheelMainstatValue(fullDataV2.mainstatSeriesKey, enhanceLevel),
    [enhanceLevel, fullDataV2.mainstatSeriesKey],
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
    formulaContext,
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
