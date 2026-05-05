import {useCallback, useEffect, useMemo, useState} from 'react'

import {useStore} from 'zustand'

import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {clampWheelEnhanceLevel, resolveWheelDescriptionRank} from '@/domain/wheel-enhance'
import {resolveWheelMainstatValue} from '@/domain/wheel-mainstat-scaling'
import type {Wheel} from '@/domain/wheels'
import {
  buildWheelDatabaseDescriptionRecord,
  buildWheelDatabaseReferenceLayer,
} from '@/domain/wheels-database-reference-layer'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'
import {useDetailModalChrome} from '@/ui/modal/useDetailModalChrome'
import {useDetailModalLifecycle} from '@/ui/modal/useDetailModalLifecycle'

import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {useWheelDetailSearch} from './useWheelDetailSearch'

interface UseWheelDetailModalStateOptions {
  wheel: Wheel
  wheels: Wheel[]
  fullData: WheelFullRecord
  onClose: () => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

export function useWheelDetailModalState({
  wheel,
  wheels,
  fullData,
  onClose,
  onSelectWheel,
}: UseWheelDetailModalStateOptions) {
  const {preferences, updateSharedPreferences, updateWheelPreferences} =
    useDatabaseDetailPreferences()
  useEffect(() => {
    collectionOwnershipStore.getState().hydrate()
  }, [])
  const collectionOwnership = useStore(collectionOwnershipStore, (state) => state.ownership)
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
        activeWheelId: fullData.id,
        formulaContext,
        wheelRecords: [fullData],
      }),
    [descriptionRank, formulaContext, fullData],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const {closeAllPopovers, contextValue, hasOpenPopovers, popoverRootProps} = popoverController
  const chrome = useDetailModalChrome({
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
    () => buildWheelDatabaseDescriptionRecord(fullData),
    [fullData],
  )
  const resolvedMainstatValue = useMemo(
    () => resolveWheelMainstatValue(fullData.mainstatSeriesKey, enhanceLevel),
    [enhanceLevel, fullData.mainstatSeriesKey],
  )

  useDetailModalLifecycle({
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
