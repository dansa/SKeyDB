import { describe, expect, it } from 'vitest'
import {
  clearOwnedEntry,
  clearCollectionOwnership,
  COLLECTION_OWNERSHIP_KEY,
  createDefaultCollectionOwnershipCatalog,
  createEmptyCollectionOwnershipState,
  getOwnedLevel,
  isOwned,
  loadCollectionOwnership,
  parseCollectionOwnershipSnapshot,
  saveCollectionOwnership,
  serializeCollectionOwnershipSnapshot,
  setDisplayUnowned,
  setOwnedLevel,
  type CollectionOwnershipCatalog,
} from './collection-ownership'

const catalog: CollectionOwnershipCatalog = {
  awakenerIds: ['1', '2'],
  wheelIds: ['W01', 'W02'],
  posseIds: ['P01', 'P02'],
  linkedAwakenerGroups: [['1', '2']],
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

describe('collection ownership persistence', () => {
  const defaultOwnedStateForCatalog = {
    ownedAwakeners: { '1': 0, '2': 0 },
    ownedWheels: { W01: 0, W02: 0 },
    ownedPosses: { P01: 0, P02: 0 },
    displayUnowned: true,
  } as const

  it('saves and loads ownership data with normalization', () => {
    const storage = createStorage()
    const saved = saveCollectionOwnership(
      storage,
      {
        ownedAwakeners: { '1': 5, unknown: 99 },
        ownedWheels: { W01: 0 },
        ownedPosses: { P01: 21 },
        displayUnowned: false,
      },
      catalog,
    )

    expect(saved).toBe(true)
    const raw = storage.rawStore.get(COLLECTION_OWNERSHIP_KEY)
    expect(raw).toContain('"version":1')

    const loaded = loadCollectionOwnership(storage, catalog)
    expect(loaded).toEqual({
      ownedAwakeners: { '1': 5, '2': 5 },
      ownedWheels: { W01: 0 },
      ownedPosses: { P01: 0 },
      displayUnowned: false,
    })
  })

  it('returns empty defaults for malformed or unsupported payloads', () => {
    const storage = createStorage()
    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{"version":999,"payload":{}}')
    expect(loadCollectionOwnership(storage, catalog)).toEqual(defaultOwnedStateForCatalog)

    storage.setItem(COLLECTION_OWNERSHIP_KEY, '{this is not json')
    expect(loadCollectionOwnership(storage, catalog)).toEqual(defaultOwnedStateForCatalog)
  })

  it('supports ownership level helpers and cleanup', () => {
    const storage = createStorage()
    let state = createEmptyCollectionOwnershipState()

    state = setOwnedLevel(state, 'wheels', 'W01', 0)
    expect(isOwned(state, 'wheels', 'W01')).toBe(true)
    expect(getOwnedLevel(state, 'wheels', 'W01')).toBe(0)

    state = setOwnedLevel(state, 'wheels', 'W01', 15)
    expect(getOwnedLevel(state, 'wheels', 'W01')).toBe(15)
    state = setOwnedLevel(state, 'wheels', 'W01', 99)
    expect(getOwnedLevel(state, 'wheels', 'W01')).toBe(15)

    state = clearOwnedEntry(state, 'wheels', 'W01')
    expect(isOwned(state, 'wheels', 'W01')).toBe(false)
    expect(getOwnedLevel(state, 'wheels', 'W01')).toBeNull()

    state = setOwnedLevel(state, 'awakeners', '1', 5, catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBe(5)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(5)

    state = setDisplayUnowned(state, false)
    expect(state.displayUnowned).toBe(false)
    state = setOwnedLevel(state, 'posses', 'P01', 13, catalog)
    expect(getOwnedLevel(state, 'posses', 'P01')).toBe(0)

    saveCollectionOwnership(storage, state, catalog)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBeTruthy()
    clearCollectionOwnership(storage)
    expect(storage.getItem(COLLECTION_OWNERSHIP_KEY)).toBeNull()
  })

  it('removes linked awakeners together and exposes default linked groups', () => {
    let state = createEmptyCollectionOwnershipState()
    state = setOwnedLevel(state, 'awakeners', '1', 7, catalog)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(7)

    state = clearOwnedEntry(state, 'awakeners', '1', catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBeNull()
    expect(getOwnedLevel(state, 'awakeners', '2')).toBeNull()

    const defaultCatalog = createDefaultCollectionOwnershipCatalog()
    expect(defaultCatalog.linkedAwakenerGroups).toContainEqual(['20', '42'])
  })

  it('serializes and parses ownership snapshot payloads for file export/import', () => {
    const snapshot = serializeCollectionOwnershipSnapshot(
      {
        ownedAwakeners: { '1': 4 },
        ownedWheels: { W01: 2 },
        ownedPosses: { P01: 0 },
        displayUnowned: true,
      },
      catalog,
    )

    const parsed = parseCollectionOwnershipSnapshot(snapshot, catalog)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) {
      return
    }
    expect(parsed.state).toEqual({
      ownedAwakeners: { '1': 4, '2': 4 },
      ownedWheels: { W01: 2 },
      ownedPosses: { P01: 0 },
      displayUnowned: true,
    })
  })

  it('rejects malformed snapshot payloads with explicit errors', () => {
    expect(parseCollectionOwnershipSnapshot('nope', catalog)).toEqual({
      ok: false,
      error: 'invalid_json',
    })
    expect(parseCollectionOwnershipSnapshot('{"version":99,"payload":{}}', catalog)).toEqual({
      ok: false,
      error: 'unsupported_version',
    })
    expect(parseCollectionOwnershipSnapshot('{"version":1}', catalog)).toEqual({
      ok: false,
      error: 'invalid_payload',
    })
  })
})
