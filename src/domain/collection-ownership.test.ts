import {describe, expect, it} from 'vitest'

import {getAwakeners} from './awakeners'
import {
  clearOwnedEntry,
  createDefaultCollectionOwnershipCatalog,
  createEmptyCollectionOwnershipState,
  getAwakenerLevel,
  getOwnedLevel,
  isOwned,
  setAwakenerLevel,
  setDisplayUnowned,
  setOwnedLevel,
  type CollectionOwnershipCatalog,
} from './collection-ownership'

const catalog: CollectionOwnershipCatalog = {
  awakenerIds: ['1', '2'],
  wheelIds: ['B01', 'B02'],
  posseIds: ['encounter-in-pure-white', 'voices-in-your-head'],
  linkedAwakenerGroups: [['1', '2']],
}

describe('collection ownership domain helpers', () => {
  it('supports ownership level helpers', () => {
    let state = createEmptyCollectionOwnershipState()

    state = setOwnedLevel(state, 'wheels', 'B01', 0)
    expect(isOwned(state, 'wheels', 'B01')).toBe(true)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(0)

    state = setOwnedLevel(state, 'wheels', 'B01', 15)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(15)
    state = setOwnedLevel(state, 'wheels', 'B01', 99)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBe(15)

    state = clearOwnedEntry(state, 'wheels', 'B01')
    expect(isOwned(state, 'wheels', 'B01')).toBe(false)
    expect(getOwnedLevel(state, 'wheels', 'B01')).toBeNull()

    state = setOwnedLevel(state, 'awakeners', '1', 5, catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBe(5)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(5)

    state = setDisplayUnowned(state, false)
    expect(state.displayUnowned).toBe(false)
    state = setAwakenerLevel(state, '1', 88, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(88)
    expect(getAwakenerLevel(state, '2')).toBe(88)
    state = setAwakenerLevel(state, '1', 0, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(1)
    expect(getAwakenerLevel(state, '2')).toBe(1)
    state = setAwakenerLevel(state, '1', 999, catalog)
    expect(getAwakenerLevel(state, '1')).toBe(90)
    expect(getAwakenerLevel(state, '2')).toBe(90)
    state = setOwnedLevel(state, 'posses', 'encounter-in-pure-white', 13, catalog)
    expect(getOwnedLevel(state, 'posses', 'encounter-in-pure-white')).toBe(0)
  })

  it('removes linked awakeners together and exposes default linked groups', () => {
    let state = createEmptyCollectionOwnershipState()
    state = setOwnedLevel(state, 'awakeners', '1', 7, catalog)
    expect(getOwnedLevel(state, 'awakeners', '2')).toBe(7)

    state = clearOwnedEntry(state, 'awakeners', '1', catalog)
    expect(getOwnedLevel(state, 'awakeners', '1')).toBeNull()
    expect(getOwnedLevel(state, 'awakeners', '2')).toBeNull()

    const defaultCatalog = createDefaultCollectionOwnershipCatalog()
    const awakeners = getAwakeners()
    const ramonaId = awakeners.find((awakener) => awakener.name === 'ramona')?.id
    const ramonaTimewornId = awakeners.find((awakener) => awakener.name === 'ramona: timeworn')?.id
    expect(ramonaId).toBeDefined()
    expect(ramonaTimewornId).toBeDefined()
    expect(defaultCatalog.linkedAwakenerGroups).toContainEqual(
      [String(ramonaId), String(ramonaTimewornId)].sort((a, b) => a.localeCompare(b)),
    )
  })
})
