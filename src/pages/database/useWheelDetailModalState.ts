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
  const [enhanceLevel, setEnhanceLevelState] = useState(0)
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
  })
  const {closeAllPopovers, contextValue, hasOpenPopovers, popoverRootProps} = popoverController
  const chrome = useDatabaseDetailChrome({
    clickOutsideClosesPopovers: true,
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
    hasOpenPopovers,
    onClose,
    searchInputRef: search.searchInputRef,
    searchQuery: search.searchQuery,
  })

  return {
    enhanceLevel,
    descriptionRank,
    popoverContextValue: contextValue,
    popoverRootProps,
    referenceLayer,
    resolvedMainstatValue,
    search,
    setEnhanceLevel,
    wheel,
    wheelDescriptionRecord,
    chrome,
  }
}
