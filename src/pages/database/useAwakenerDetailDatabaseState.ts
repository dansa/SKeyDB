import {useCallback, useEffect, useMemo, useRef, useState} from 'react'

import {
  normalizeAwakenerDatabaseSelectionForRecord,
  patchAwakenerDatabaseSelection,
  resolveAwakenerDatabaseState,
  type AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import {type AwakenerFullV2Record} from '@/domain/awakeners-full-v2'
import {loadCollectionOwnership} from '@/domain/collection-ownership'
import {resolveDatabaseDetailDefaultSelection} from '@/domain/database-detail-preferences'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {getBrowserLocalStorage} from '@/domain/storage'

import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

interface UseAwakenerDetailDatabaseStateOptions {
  fullDataV2: AwakenerFullV2Record
}

export function useAwakenerDetailDatabaseState({
  fullDataV2,
}: UseAwakenerDetailDatabaseStateOptions) {
  const {preferences, updateAwakenerPreferences, updateSharedPreferences} =
    useDatabaseDetailPreferences()
  const [collectionOwnership] = useState(() => loadCollectionOwnership(getBrowserLocalStorage()))
  const formulaContext = useMemo(
    () =>
      buildPublicFormulaContext({
        accountLevel: preferences.shared.accountLevel,
        collectionOwnership,
      }),
    [collectionOwnership, preferences.shared.accountLevel],
  )

  const defaultSelection = useMemo(
    () => resolveDatabaseDetailDefaultSelection(fullDataV2, preferences),
    [fullDataV2, preferences],
  )
  const [selection, setSelection] = useState(defaultSelection)
  const previousRecordIdRef = useRef(fullDataV2.id)

  useEffect(() => {
    if (previousRecordIdRef.current === fullDataV2.id) {
      return
    }

    previousRecordIdRef.current = fullDataV2.id
    setSelection(defaultSelection)
  }, [defaultSelection, fullDataV2.id])

  const resolvedDatabaseState = useMemo(
    () => resolveAwakenerDatabaseState(fullDataV2, selection, {formulaContext}),
    [formulaContext, fullDataV2, selection],
  )

  const handlePatchDefaultSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      const nextSelection = normalizeAwakenerDatabaseSelectionForRecord(fullDataV2, {
        ...preferences.awakener.defaultSelection,
        ...nextPartial,
      })
      updateAwakenerPreferences({defaultSelection: nextSelection})
    },
    [fullDataV2, preferences.awakener.defaultSelection, updateAwakenerPreferences],
  )

  const handlePatchSelection = useCallback(
    (nextPartial: Partial<AwakenerDatabaseSelection>) => {
      setSelection((previousSelection) =>
        patchAwakenerDatabaseSelection(fullDataV2, previousSelection, nextPartial),
      )
    },
    [fullDataV2],
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
