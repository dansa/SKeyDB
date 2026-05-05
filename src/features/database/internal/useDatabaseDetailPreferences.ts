import {useCallback, useState} from 'react'

import {useStore} from 'zustand'

import {
  type DatabaseAwakenerDetailPreferences,
  type DatabaseDetailPreferencesPatch,
  type DatabaseDetailSharedPreferences,
  type DatabaseWheelDetailPreferences,
} from '@/domain/database-detail-preferences'
import {hydrateDatabaseDetailPreferences, preferencesStore} from '@/stores/preferencesStore'

export function useDatabaseDetailPreferences() {
  useState(() => {
    hydrateDatabaseDetailPreferences()
    return true
  })

  const storePreferences = useStore(preferencesStore, (state) => state.databaseDetailPreferences)
  const updateDatabaseDetailPreferences = useStore(
    preferencesStore,
    (state) => state.updateDatabaseDetailPreferences,
  )
  const updatePreferences = useCallback(
    (nextPartial: DatabaseDetailPreferencesPatch) => {
      updateDatabaseDetailPreferences(nextPartial)
    },
    [updateDatabaseDetailPreferences],
  )

  const updateSharedPreferences = useCallback(
    (nextPartial: Partial<DatabaseDetailSharedPreferences>) => {
      updatePreferences({shared: nextPartial})
    },
    [updatePreferences],
  )

  const updateAwakenerPreferences = useCallback(
    (nextPartial: Partial<DatabaseAwakenerDetailPreferences>) => {
      updatePreferences({awakener: nextPartial})
    },
    [updatePreferences],
  )

  const updateWheelPreferences = useCallback(
    (nextPartial: Partial<DatabaseWheelDetailPreferences>) => {
      updatePreferences({wheel: nextPartial})
    },
    [updatePreferences],
  )

  return {
    preferences: storePreferences,
    updatePreferences,
    updateSharedPreferences,
    updateAwakenerPreferences,
    updateWheelPreferences,
  }
}
