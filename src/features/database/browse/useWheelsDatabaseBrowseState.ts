import {useCallback, useMemo, useState} from 'react'

import {
  hasWheelsSortSearchParams,
  readDatabaseBrowsePreferences,
  writeWheelsDatabaseBrowseSortPreferences,
} from '@/domain/database-browse-preferences'
import {getBrowserLocalStorage} from '@/domain/storage'
import type {WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {
  getDefaultWheelsDatabaseSortDirection,
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
  type WheelsDatabaseBrowseState,
  type WheelsDatabaseRarityFilterId,
  type WheelsDatabaseRealmFilterId,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function useWheelsDatabaseBrowseState() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [, setStoredSortRevision] = useState(0)
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<WheelsDatabaseBrowseState>({
    parseState: (searchParams) => {
      const parsed = parseWheelsDatabaseBrowseState(searchParams)
      if (hasWheelsSortSearchParams(searchParams)) {
        return parsed
      }
      const preferences = readDatabaseBrowsePreferences(storage)
      return {
        ...parsed,
        ...preferences.wheels,
      }
    },
    patchState: patchWheelsDatabaseBrowseState,
  })
  const {mainstatFilter, query, rarityFilter, realmFilter, sortDirection, sortKey} = browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions(query, commitBrowseState)

  const setRealmFilter = useCallback(
    (next: WheelsDatabaseRealmFilterId) => {
      commitBrowseState({realmFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setRarityFilter = useCallback(
    (next: WheelsDatabaseRarityFilterId) => {
      commitBrowseState({rarityFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setMainstatFilter = useCallback(
    (next: WheelMainstatFilter) => {
      commitBrowseState({mainstatFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setSortKey = useCallback(
    (next: WheelsDatabaseSortKey) => {
      const nextSortDirection = getDefaultWheelsDatabaseSortDirection(next)
      writeWheelsDatabaseBrowseSortPreferences(
        {
          sortKey: next,
          sortDirection: nextSortDirection,
        },
        storage,
      )
      setStoredSortRevision((current) => current + 1)
      commitBrowseState(
        {
          sortKey: next,
          sortDirection: nextSortDirection,
        },
        'push',
      )
    },
    [commitBrowseState, storage],
  )

  const toggleSortDirection = useCallback(() => {
    const nextSortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC'
    writeWheelsDatabaseBrowseSortPreferences({sortKey, sortDirection: nextSortDirection}, storage)
    setStoredSortRevision((current) => current + 1)
    commitBrowseState(
      {
        sortDirection: nextSortDirection,
      },
      'push',
    )
  }, [commitBrowseState, sortDirection, sortKey, storage])

  const resetFilters = useCallback(() => {
    commitBrowseState(
      {
        query: '',
        realmFilter: 'ALL',
        rarityFilter: 'ALL',
        mainstatFilter: 'ALL',
      },
      'push',
    )
  }, [commitBrowseState])

  return {
    query,
    realmFilter,
    rarityFilter,
    mainstatFilter,
    sortKey,
    sortDirection,
    setQuery,
    appendSearchCharacter,
    removeSearchCharacter,
    clearQuery,
    setRealmFilter,
    setRarityFilter,
    setMainstatFilter,
    setSortKey,
    toggleSortDirection,
    resetFilters,
  }
}
