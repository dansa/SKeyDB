import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import type {Awakener} from '@/domain/awakeners'

import {resetDatabaseStore} from './useDatabaseStore'
import {useDatabaseViewModel} from './useDatabaseViewModel'

const {TEST_AWAKENERS} = vi.hoisted(() => ({
  TEST_AWAKENERS: [
    {
      id: 1,
      name: 'alpha',
      realm: 'CHAOS',
      rarity: 'SSR',
      type: 'ASSAULT',
      faction: 'Test',
      aliases: ['alpha'],
      tags: ['Bleed'],
      stats: {ATK: 170, DEF: 90, CON: 110},
    },
    {
      id: 2,
      name: 'beta',
      realm: 'AEQUOR',
      rarity: 'Genesis',
      type: 'WARDEN',
      faction: 'Test',
      aliases: ['beta'],
      tags: ['Support'],
      stats: {ATK: 150, DEF: 140, CON: 180},
    },
    {
      id: 3,
      name: 'atlas',
      realm: 'AEQUOR',
      rarity: 'SR',
      type: 'ASSAULT',
      faction: 'Test',
      aliases: ['atlas'],
      tags: ['Burn'],
      stats: {ATK: 150, DEF: 200, CON: 95},
    },
  ] satisfies Awakener[],
}))

vi.mock('@/domain/awakeners', () => ({
  getAwakeners: () => TEST_AWAKENERS,
}))

afterEach(() => {
  resetDatabaseStore()
})

describe('useDatabaseViewModel', () => {
  it('derives filtered awakeners from search and filter state', () => {
    const {result} = renderHook(() => useDatabaseViewModel())

    act(() => {
      result.current.setQuery('support')
      result.current.setRealmFilter('AEQUOR')
      result.current.setRarityFilter('Genesis')
      result.current.setTypeFilter('WARDEN')
    })

    expect(result.current.totalCount).toBe(3)
    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['beta'])
  })

  it('sorts by stat and groups by realm using store-backed actions', () => {
    const {result} = renderHook(() => useDatabaseViewModel())

    act(() => {
      result.current.setSortKey('ATK')
      result.current.toggleSortDirection()
      result.current.setGroupByRealm(true)
    })

    expect(result.current.sortDirection).toBe('DESC')
    expect(result.current.groupByRealm).toBe(true)
    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual([
      'alpha',
      'atlas',
      'beta',
    ])
  })

  it('appends and clears query text through memoized callbacks', () => {
    const {result} = renderHook(() => useDatabaseViewModel())

    act(() => {
      result.current.appendSearchCharacter('a')
      result.current.appendSearchCharacter('t')
    })

    expect(result.current.query).toBe('at')
    expect(result.current.awakeners.map((awakener) => awakener.name)).toEqual(['atlas'])

    act(() => {
      result.current.clearQuery()
    })

    expect(result.current.query).toBe('')
    expect(result.current.awakeners).toHaveLength(3)
  })
})
