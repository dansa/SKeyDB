import {createStore} from 'zustand/vanilla'

import {
  readDatabaseDetailPreferences,
  writeDatabaseDetailPreferences,
  type DatabaseDetailPreferences,
  type DatabaseDetailPreferencesPatch,
} from '@/domain/database-detail-preferences'

export interface PreferencesState {
  databaseDetailPreferences: DatabaseDetailPreferences
  detailSearchCaptureSuppressionDepth: number
  hydrateDatabaseDetailPreferences: () => void
  incrementDetailSearchCaptureSuppression: () => void
  decrementDetailSearchCaptureSuppression: () => void
  isDetailSearchCaptureSuppressed: () => boolean
  updateDatabaseDetailPreferences: (nextPartial: DatabaseDetailPreferencesPatch) => void
}

function areDatabaseDetailPreferencesEqual(
  left: DatabaseDetailPreferences,
  right: DatabaseDetailPreferences,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function createPreferencesStore() {
  return createStore<PreferencesState>()((set, get) => ({
    databaseDetailPreferences: readDatabaseDetailPreferences(),
    detailSearchCaptureSuppressionDepth: 0,
    hydrateDatabaseDetailPreferences: () => {
      const next = readDatabaseDetailPreferences()
      if (areDatabaseDetailPreferencesEqual(get().databaseDetailPreferences, next)) {
        return
      }

      set({
        databaseDetailPreferences: next,
      })
    },
    incrementDetailSearchCaptureSuppression: () => {
      set((state) => ({
        detailSearchCaptureSuppressionDepth: state.detailSearchCaptureSuppressionDepth + 1,
      }))
    },
    decrementDetailSearchCaptureSuppression: () => {
      set((state) => ({
        detailSearchCaptureSuppressionDepth: Math.max(
          0,
          state.detailSearchCaptureSuppressionDepth - 1,
        ),
      }))
    },
    isDetailSearchCaptureSuppressed: () => get().detailSearchCaptureSuppressionDepth > 0,
    updateDatabaseDetailPreferences: (nextPartial) => {
      writeDatabaseDetailPreferences(nextPartial)
      set({
        databaseDetailPreferences: readDatabaseDetailPreferences(),
      })
    },
  }))
}

export const preferencesStore = createPreferencesStore()

export function hydrateDatabaseDetailPreferences() {
  preferencesStore.getState().hydrateDatabaseDetailPreferences()
}
