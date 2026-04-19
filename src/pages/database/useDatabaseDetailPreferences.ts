import {useCallback, useState} from 'react'

import {
  mergeDatabaseDetailPreferences,
  readDatabaseDetailPreferences,
  writeDatabaseDetailPreferences,
  type DatabaseAwakenerDetailPreferences,
  type DatabaseDetailPreferences,
  type DatabaseDetailPreferencesPatch,
  type DatabaseDetailSharedPreferences,
  type DatabaseWheelDetailPreferences,
} from '@/domain/database-detail-preferences'

export function useDatabaseDetailPreferences() {
  const [preferences, setPreferences] = useState<DatabaseDetailPreferences>(
    readDatabaseDetailPreferences,
  )

  const updatePreferences = useCallback((nextPartial: DatabaseDetailPreferencesPatch) => {
    setPreferences((previous) => {
      const next = mergeDatabaseDetailPreferences(previous, nextPartial)
      writeDatabaseDetailPreferences(nextPartial)
      return next
    })
  }, [])

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
    preferences,
    updatePreferences,
    updateSharedPreferences,
    updateAwakenerPreferences,
    updateWheelPreferences,
  }
}
