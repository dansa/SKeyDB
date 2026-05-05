import {useCallback} from 'react'

import {useSearchParams} from 'react-router-dom'

import {
  DATABASE_BROWSE_DEFAULTS,
  parseDatabaseBrowseState,
  patchDatabaseBrowseState,
  type DatabaseBrowseState,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import type {DatabaseSortKey} from '@/domain/database-sorting'

import {useBrowseQueryActions} from './useBrowseQueryActions'

type BrowseHistoryMode = 'push' | 'replace'

interface UseUrlBackedBrowseStateOptions<TState> {
  parseState: (searchParams: URLSearchParams) => TState
  patchState: (searchParams: URLSearchParams, patch: Partial<TState>) => URLSearchParams
}

export function useUrlBackedBrowseState<TState>({
  parseState,
  patchState,
}: UseUrlBackedBrowseStateOptions<TState>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const browseState = parseState(searchParams)

  const commitBrowseState = useCallback(
    (patch: Partial<TState>, historyMode: BrowseHistoryMode) => {
      const nextParams = patchState(searchParams, patch)
      if (nextParams.toString() === searchParams.toString()) {
        return
      }

      setSearchParams(nextParams, {replace: historyMode === 'replace'})
    },
    [patchState, searchParams, setSearchParams],
  )

  return {browseState, commitBrowseState}
}

export function useDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<DatabaseBrowseState>({
    parseState: parseDatabaseBrowseState,
    patchState: patchDatabaseBrowseState,
  })
  const {groupByRealm, query, rarityFilter, realmFilter, sortDirection, sortKey, typeFilter} =
    browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions<DatabaseBrowseState>(query, commitBrowseState)

  const setRealmFilter = useCallback(
    (next: RealmFilterId) => {
      commitBrowseState({realmFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setRarityFilter = useCallback(
    (next: RarityFilterId) => {
      commitBrowseState({rarityFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setTypeFilter = useCallback(
    (next: TypeFilterId) => {
      commitBrowseState({typeFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setSortKey = useCallback(
    (next: DatabaseSortKey) => {
      commitBrowseState({sortKey: next}, 'push')
    },
    [commitBrowseState],
  )

  const toggleSortDirection = useCallback(() => {
    commitBrowseState(
      {
        sortDirection: sortDirection === 'ASC' ? 'DESC' : DATABASE_BROWSE_DEFAULTS.sortDirection,
      },
      'push',
    )
  }, [commitBrowseState, sortDirection])

  const setGroupByRealm = useCallback(
    (next: boolean) => {
      commitBrowseState({groupByRealm: next}, 'push')
    },
    [commitBrowseState],
  )

  const resetFilters = useCallback(() => {
    commitBrowseState(
      {
        query: '',
        realmFilter: 'ALL',
        rarityFilter: 'ALL',
        typeFilter: 'ALL',
      },
      'push',
    )
  }, [commitBrowseState])

  return {
    groupByRealm,
    query,
    rarityFilter,
    realmFilter,
    sortDirection,
    sortKey,
    typeFilter,
    setQuery,
    appendSearchCharacter,
    removeSearchCharacter,
    clearQuery,
    setRealmFilter,
    setRarityFilter,
    setTypeFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
    resetFilters,
  }
}
