import {createStore} from 'zustand/vanilla'

import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'

export const D_ZONE_SELECTED_ALERT_STORAGE_KEY = 'd-zone-selected-alert-id'

interface CreateDZonePreferencesStoreOptions {
  storage?: StorageLike | null
}

export interface DZonePreferencesState {
  selectedAlertId: string | null
  hydrateSelectedAlertId: () => void
  setSelectedAlertId: (alertId: string) => void
}

function readSelectedAlertId(storage: StorageLike | null): string | null {
  return safeStorageRead(storage, D_ZONE_SELECTED_ALERT_STORAGE_KEY)
}

export function createDZonePreferencesStore({
  storage = getBrowserLocalStorage(),
}: CreateDZonePreferencesStoreOptions = {}) {
  return createStore<DZonePreferencesState>()((set) => ({
    selectedAlertId: readSelectedAlertId(storage),
    hydrateSelectedAlertId: () => {
      set({selectedAlertId: readSelectedAlertId(storage)})
    },
    setSelectedAlertId: (alertId) => {
      safeStorageWrite(storage, D_ZONE_SELECTED_ALERT_STORAGE_KEY, alertId)
      set({selectedAlertId: alertId})
    },
  }))
}

export const dzonePreferencesStore = createDZonePreferencesStore()

export function hydrateDZoneSelectedAlertId() {
  dzonePreferencesStore.getState().hydrateSelectedAlertId()
}
