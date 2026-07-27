import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {useStore} from 'zustand'

import {
  normalizeAwakenerDatabaseSelectionForRecord,
  patchAwakenerDatabaseSelection,
  resolveAwakenerDatabaseState,
  type AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import {type AwakenerFullRecord} from '@/domain/awakeners-full'
import {resolveDatabaseDetailDefaultSelection} from '@/domain/database-detail-preferences'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

interface UseAwakenerDetailDatabaseStateOptions {
  fullData: AwakenerFullRecord
}

export function useAwakenerDetailDatabaseState({fullData}: UseAwakenerDetailDatabaseStateOptions) {
  const {preferences, updateAwakenerPreferences, updateSharedPreferences} =
    useDatabaseDetailPreferences()
  useEffect(() => {
    collectionOwnershipStore.getState().hydrate()
  }, [])
  const collectionOwnership = useStore(collectionOwnershipStore, (state) => state.ownership)
  const formulaContext = useMemo(
    () =>
      buildPublicFormulaContext({
        accountLevel: preferences.shared.accountLevel,
        collectionOwnership,
      }),
    [collectionOwnership, preferences.shared.accountLevel],
  )

  const defaultSelection = useMemo(
    () => resolveDatabaseDetailDefaultSelection(fullData, preferences),
    [fullData, preferences],
  )
  const [selection, setSelection] = useState(defaultSelection)
  const previousRecordIdRef = useRef(fullData.id)

  useEffect(() => {
    if (previousRecordIdRef.current === fullData.id) {
      return
    }

    previousRecordIdRef.current = fullData.id
    setSelection(defaultSelection)
  }, [defaultSelection, fullData.id])

  const resolvedDatabaseState = useMemo(
    () => resolveAwakenerDatabaseState(fullData, selection, {formulaContext}),
    [formulaContext, fullData, selection],
  )

  const handlePatchDefaultSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      const nextSelection = normalizeAwakenerDatabaseSelectionForRecord(fullData, {
        ...preferences.awakener.defaultSelection,
        ...nextPartial,
      })
      updateAwakenerPreferences({defaultSelection: nextSelection})
    },
    [fullData, preferences.awakener.defaultSelection, updateAwakenerPreferences],
  )

  const handlePatchSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      setSelection((previousSelection) =>
        patchAwakenerDatabaseSelection(fullData, previousSelection, nextPartial),
      )
    },
    [fullData],
  )

  const handleToggleEnlightenSlot = useCallback(
    (slot: AwakenerDatabaseSelection['selectedEnlightenSlot']) => {
      handlePatchSelection({
        selectedEnlightenSlot:
          resolvedDatabaseState.selection.selectedEnlightenSlot === slot ? null : slot,
      })
    },
    [handlePatchSelection, resolvedDatabaseState.selection.selectedEnlightenSlot],
  )

  return {
    actions: {
      patchDefaultSelection: handlePatchDefaultSelection,
      patchSelection: handlePatchSelection,
      toggleEnlightenSlot: handleToggleEnlightenSlot,
      updateAwakenerPreferences,
      updateSharedPreferences,
    },
    preferences: {
      awakener: preferences.awakener,
      shared: preferences.shared,
    },
    runtime: {
      referenceLayer: resolvedDatabaseState.referenceLayer,
      resolvedControls: resolvedDatabaseState.controls,
      resolvedSelection: resolvedDatabaseState.selection,
      resolvedStats: resolvedDatabaseState.stats,
      shellView: resolvedDatabaseState.shellView,
    },
  }
}
