import {describe, expect, it} from 'vitest'

import {
  COLLECTION_OWNERSHIP_KEY,
  COLLECTION_OWNERSHIP_LEGACY_KEY,
} from '@/features/collection/collectionMigrations'

import {createCollectionOwnershipStore} from './collectionOwnershipStore'

const catalog = {
  awakenerIds: ['awakener-0001', 'awakener-0002'],
  wheelIds: ['wheel-0001', 'wheel-0002'],
  posseIds: ['posse-0001', 'posse-0002'],
  linkedAwakenerGroups: [['awakener-0001', 'awakener-0002']],
}

function createStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    rawStore: store,
  }
}

describe('collectionOwnershipStore', () => {
  it('hydrates shipped v1 ownership and writes the current public-id snapshot', () => {
    const storage = createStorage()
    storage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 4},
          awakenerLevels: {'1': 72},
          ownedWheels: {B01: 2},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )

    const store = createCollectionOwnershipStore({catalog, storage})
    store.getState().hydrate()

    expect(store.getState().ownership).toEqual({
      ownedAwakeners: {'awakener-0001': 4, 'awakener-0002': 4},
      awakenerLevels: {'awakener-0001': 72, 'awakener-0002': 72},
      ownedWheels: {'wheel-0001': 2},
      ownedPosses: {'posse-0001': 0},
      displayUnowned: false,
    })
    expect(storage.getItem(COLLECTION_OWNERSHIP_LEGACY_KEY)).toBeTruthy()
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"awakener-0001"')
  })

  it('does not fall back or overwrite when an invalid current snapshot exists', () => {
    const storage = createStorage()
    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{"version":999,"payload":{}}')
    storage.setItem(
      COLLECTION_OWNERSHIP_LEGACY_KEY,
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 5},
          awakenerLevels: {'1': 80},
          ownedWheels: {B01: 7},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )

    const store = createCollectionOwnershipStore({catalog, storage})
    store.getState().hydrate()

    expect(store.getState().ownership).toEqual({
      ownedAwakeners: {'awakener-0001': 0, 'awakener-0002': 0},
      awakenerLevels: {'awakener-0001': 60, 'awakener-0002': 60},
      ownedWheels: {'wheel-0001': 0, 'wheel-0002': 0},
      ownedPosses: {'posse-0001': 0, 'posse-0002': 0},
      displayUnowned: true,
    })
    expect(store.getState().persistenceStatus).toBe('blocked')
    expect(store.getState().save()).toBe(false)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBe('{"version":999,"payload":{}}')
  })

  it('keeps linked awakener ownership, remembered levels, and display-unowned in the store', () => {
    const storage = createStorage()
    const store = createCollectionOwnershipStore({catalog, storage})
    store.getState().hydrate()

    store.getState().setOwnedLevel('awakeners', 'awakener-0001', 6)
    expect(store.getState().ownership.ownedAwakeners).toEqual({
      'awakener-0001': 6,
      'awakener-0002': 6,
    })

    store.getState().toggleOwned('awakeners', 'awakener-0001')
    expect(store.getState().ownership.ownedAwakeners).toEqual({})

    store.getState().toggleOwned('awakeners', 'awakener-0001')
    expect(store.getState().ownership.ownedAwakeners).toEqual({
      'awakener-0001': 6,
      'awakener-0002': 6,
    })

    store.getState().setAwakenerLevel('awakener-0001', 88)
    expect(store.getState().ownership.awakenerLevels).toEqual({
      'awakener-0001': 88,
      'awakener-0002': 88,
    })

    store.getState().setDisplayUnowned(false)
    expect(store.getState().ownership.displayUnowned).toBe(false)

    expect(store.getState().save()).toBe(true)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"displayUnowned":false')
  })

  it('imports ownership snapshots into live state and persists canonical current ids', () => {
    const storage = createStorage()
    const store = createCollectionOwnershipStore({catalog, storage})
    store.getState().hydrate()

    const result = store.getState().importSnapshot(
      JSON.stringify({
        version: 1,
        payload: {
          ownedAwakeners: {'1': 3},
          awakenerLevels: {'1': 42},
          ownedWheels: {B01: 9},
          ownedPosses: {'encounter-in-pure-white': 0},
          displayUnowned: false,
        },
      }),
    )

    expect(result).toEqual(expect.objectContaining({ok: true, migratedFromVersion: 1}))
    expect(store.getState().ownership).toEqual({
      ownedAwakeners: {'awakener-0001': 3, 'awakener-0002': 3},
      awakenerLevels: {'awakener-0001': 42, 'awakener-0002': 42},
      ownedWheels: {'wheel-0001': 9},
      ownedPosses: {'posse-0001': 0},
      displayUnowned: false,
    })
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toContain('"wheel-0001"')
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).not.toContain('"B01"')
  })
})
