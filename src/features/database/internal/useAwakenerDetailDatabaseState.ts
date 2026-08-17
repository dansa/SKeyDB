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

import {useAwakenerDetailSession} from './awakener-detail-session'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

interface UseAwakenerDetailDatabaseStateOptions {
  fullData: AwakenerFullRecord
}

export function useAwakenerDetailDatabaseState({fullData}: UseAwakenerDetailDatabaseStateOptions) {
  const detailSession = useAwakenerDetailSession()
  const {preferences, updateAwakenerPreferences, updateSharedPreferences} =
    useDatabaseDetailPreferences()
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
  const selectionSessionKey = detailSession?.key ?? String(fullData.id)
  const persistedSelection =
    detailSession?.key === selectionSessionKey ? detailSession.selection : null
  const [selectionState, setSelectionState] = useState(() => ({
    key: selectionSessionKey,
    selection: persistedSelection ?? defaultSelection,
  }))
  const selection =
    selectionState.key === selectionSessionKey
      ? selectionState.selection
      : (persistedSelection ?? defaultSelection)
  const selectionRef = useRef(selection)

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useEffect(() => {
    if (detailSession?.selection === null) {
      detailSession.onSelectionChange(selection)
    }
  }, [detailSession, selection])

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
      const nextSelection = patchAwakenerDatabaseSelection(
        fullData,
        selectionRef.current,
        nextPartial,
      )
      selectionRef.current = nextSelection
      setSelectionState({key: selectionSessionKey, selection: nextSelection})
      detailSession?.onSelectionChange(nextSelection)
    },
    [detailSession, fullData, selectionSessionKey],
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
