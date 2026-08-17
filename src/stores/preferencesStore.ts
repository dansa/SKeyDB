import {createStore} from 'zustand/vanilla'

import {
  createDatabaseDetailPreferencesRepository,
  type DatabaseDetailPreferences,
  type DatabaseDetailPreferencesPatch,
  type DatabaseDetailPreferencesRepository,
} from '@/domain/database-detail-preferences'

export interface PreferencesState {
  databaseDetailPreferences: DatabaseDetailPreferences
  detailSearchCaptureSuppressionDepth: number
  flushDatabaseDetailPreferences: () => boolean
  hydrateDatabaseDetailPreferences: () => void
  incrementDetailSearchCaptureSuppression: () => void
  decrementDetailSearchCaptureSuppression: () => void
  isDetailSearchCaptureSuppressed: () => boolean
  updateDatabaseDetailPreferences: (nextPartial: DatabaseDetailPreferencesPatch) => void
}

export function createPreferencesStore(
  repository: DatabaseDetailPreferencesRepository = createDatabaseDetailPreferencesRepository(),
) {
  return createStore<PreferencesState>()((set, get) => ({
    databaseDetailPreferences: repository.getPreferences(),
    detailSearchCaptureSuppressionDepth: 0,
    flushDatabaseDetailPreferences: repository.flush,
    hydrateDatabaseDetailPreferences: () => {
      const next = repository.hydrate()
      if (get().databaseDetailPreferences === next) {
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
      const next = repository.update(nextPartial)
      if (get().databaseDetailPreferences === next) {
        return
      }
      set({
        databaseDetailPreferences: next,
      })
    },
  }))
}

export const preferencesStore = createPreferencesStore()

export function hydrateDatabaseDetailPreferences() {
  preferencesStore.getState().hydrateDatabaseDetailPreferences()
}

export function flushDatabaseDetailPreferences() {
  return preferencesStore.getState().flushDatabaseDetailPreferences()
}
