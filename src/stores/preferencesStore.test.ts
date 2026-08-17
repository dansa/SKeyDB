import {describe, expect, it, vi} from 'vitest'

import {
  DEFAULT_DATABASE_DETAIL_PREFERENCES,
  createDatabaseDetailPreferencesRepository,
} from '@/domain/database-detail-preferences'

import {createPreferencesStore} from './preferencesStore'

describe('preferencesStore', () => {
  it('publishes normalized repository updates before deferred persistence', () => {
    const write = vi.fn().mockReturnValue(true)
    const scheduledCallbacks: (() => void)[] = []
    const repository = createDatabaseDetailPreferencesRepository({
      adapter: {
        read: () => DEFAULT_DATABASE_DETAIL_PREFERENCES,
        write,
      },
      scheduler: {
        schedule(callback) {
          scheduledCallbacks.push(callback)
          return vi.fn()
        },
      },
    })
    const store = createPreferencesStore(repository)
    const subscriber = vi.fn()
    store.subscribe(subscriber)

    store.getState().updateDatabaseDetailPreferences({shared: {accountLevel: 999}})

    expect(store.getState().databaseDetailPreferences.shared.accountLevel).toBe(100)
    expect(subscriber).toHaveBeenCalledOnce()
    expect(write).toHaveBeenCalledOnce()

    store.getState().updateDatabaseDetailPreferences({shared: {accountLevel: 99}})

    expect(store.getState().databaseDetailPreferences.shared.accountLevel).toBe(99)
    expect(write).toHaveBeenCalledOnce()

    scheduledCallbacks[0]?.()

    expect(write).toHaveBeenCalledTimes(2)
    expect(write.mock.calls[1]?.[0].shared.accountLevel).toBe(99)
  })

  it('merges consecutive patches against the current store snapshot', () => {
    const repository = createDatabaseDetailPreferencesRepository({
      adapter: {
        read: () => DEFAULT_DATABASE_DETAIL_PREFERENCES,
        write: () => true,
      },
      scheduler: {
        schedule() {
          return vi.fn()
        },
      },
    })
    const store = createPreferencesStore(repository)

    store.getState().updateDatabaseDetailPreferences({shared: {fontScale: 'large'}})
    store.getState().updateDatabaseDetailPreferences({wheel: {expandLoreByDefault: true}})

    expect(store.getState().databaseDetailPreferences).toMatchObject({
      shared: {fontScale: 'large'},
      wheel: {expandLoreByDefault: true},
    })
  })
})
