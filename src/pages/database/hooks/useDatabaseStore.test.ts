import {afterEach, describe, expect, it} from 'vitest'

import {resetDatabaseStore, useDatabaseStore} from './useDatabaseStore'

afterEach(() => {
  resetDatabaseStore()
})

describe('useDatabaseStore', () => {
  it('updates query and filter state through store actions', () => {
    const initialState = useDatabaseStore.getState()

    initialState.setQuery('alpha')
    initialState.setRealmFilter('CHAOS')
    initialState.setRarityFilter('SSR')
    initialState.setTypeFilter('ASSAULT')
    initialState.setSortKey('ATK')
    initialState.setGroupByRealm(true)

    const nextState = useDatabaseStore.getState()

    expect(nextState.query).toBe('alpha')
    expect(nextState.realmFilter).toBe('CHAOS')
    expect(nextState.rarityFilter).toBe('SSR')
    expect(nextState.typeFilter).toBe('ASSAULT')
    expect(nextState.sortKey).toBe('ATK')
    expect(nextState.groupByRealm).toBe(true)
  })

  it('appends, clears, toggles, and resets state deterministically', () => {
    const initialState = useDatabaseStore.getState()

    initialState.appendSearchCharacter('a')
    initialState.appendSearchCharacter('b')
    initialState.toggleSortDirection()

    let nextState = useDatabaseStore.getState()
    expect(nextState.query).toBe('ab')
    expect(nextState.sortDirection).toBe('DESC')

    nextState.toggleSortDirection()
    nextState.setSortKey('DEF')
    nextState = useDatabaseStore.getState()
    expect(nextState.sortDirection).toBe('ASC')
    expect(nextState.sortKey).toBe('DEF')

    nextState.clearQuery()
    nextState.reset()
    nextState = useDatabaseStore.getState()

    expect(nextState.query).toBe('')
    expect(nextState.realmFilter).toBe('ALL')
    expect(nextState.rarityFilter).toBe('ALL')
    expect(nextState.typeFilter).toBe('ALL')
    expect(nextState.sortKey).toBe('ALPHABETICAL')
    expect(nextState.sortDirection).toBe('ASC')
    expect(nextState.groupByRealm).toBe(false)
  })
})
