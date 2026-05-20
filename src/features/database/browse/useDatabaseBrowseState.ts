import {useCallback, useMemo, useState} from 'react'

import {useSearchParams} from 'react-router-dom'

import {
  hasAwakenerSortSearchParams,
  readDatabaseBrowsePreferences,
  writeAwakenerDatabaseBrowseSortPreferences,
} from '@/domain/database-browse-preferences'
import {
  DATABASE_BROWSE_DEFAULTS,
  parseDatabaseBrowseState,
  patchDatabaseBrowseState,
  type AvailabilityFilterId,
  type AwakenerScalingSubstatRoleFilter,
  type DatabaseBrowseState,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type SubstatScalingKey,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import type {DatabaseSortKey} from '@/domain/database-sorting'
import {getBrowserLocalStorage} from '@/domain/storage'

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
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [, setStoredSortRevision] = useState(0)
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<DatabaseBrowseState>({
    parseState: (searchParams) => {
      const parsed = parseDatabaseBrowseState(searchParams)
      if (hasAwakenerSortSearchParams(searchParams)) {
        return parsed
      }
      const preferences = readDatabaseBrowsePreferences(storage)
      return {
        ...parsed,
        ...preferences.awakeners,
      }
    },
    patchState: patchDatabaseBrowseState,
  })
  const {
    availabilityFilter,
    groupByRealm,
    gameplayFactionFilters,
    query,
    rarityFilter,
    realmFilter,
    scalingSubstatRoleFilter,
    scalingSubstatFilters,
    sortDirection,
    sortKey,
    typeFilter,
  } = browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions(query, commitBrowseState)

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

  const setAvailabilityFilter = useCallback(
    (next: AvailabilityFilterId) => {
      commitBrowseState({availabilityFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const setGameplayFactionFilters = useCallback(
    (next: GameplayFactionFilterId[]) => {
      commitBrowseState({gameplayFactionFilters: next}, 'push')
    },
    [commitBrowseState],
  )

  const toggleGameplayFactionFilter = useCallback(
    (filter: GameplayFactionFilterId) => {
      const next = gameplayFactionFilters.includes(filter) ? [] : [filter]
      setGameplayFactionFilters(next)
    },
    [gameplayFactionFilters, setGameplayFactionFilters],
  )

  const setScalingSubstatFilters = useCallback(
    (next: SubstatScalingKey[]) => {
      commitBrowseState({scalingSubstatFilters: next}, 'push')
    },
    [commitBrowseState],
  )

  const setScalingSubstatRoleFilter = useCallback(
    (next: AwakenerScalingSubstatRoleFilter) => {
      commitBrowseState({scalingSubstatRoleFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const toggleScalingSubstatFilter = useCallback(
    (filter: SubstatScalingKey) => {
      const next = scalingSubstatFilters.includes(filter)
        ? scalingSubstatFilters.filter((value) => value !== filter)
        : [...scalingSubstatFilters, filter]
      setScalingSubstatFilters(next)
    },
    [scalingSubstatFilters, setScalingSubstatFilters],
  )

  const setSortKey = useCallback(
    (next: DatabaseSortKey) => {
      writeAwakenerDatabaseBrowseSortPreferences(
        {sortKey: next, sortDirection, groupByRealm},
        storage,
      )
      setStoredSortRevision((current) => current + 1)
      commitBrowseState({sortKey: next}, 'push')
    },
    [commitBrowseState, groupByRealm, sortDirection, storage],
  )

  const toggleSortDirection = useCallback(() => {
    const nextSortDirection =
      sortDirection === 'ASC' ? 'DESC' : DATABASE_BROWSE_DEFAULTS.sortDirection
    writeAwakenerDatabaseBrowseSortPreferences(
      {sortKey, sortDirection: nextSortDirection, groupByRealm},
      storage,
    )
    setStoredSortRevision((current) => current + 1)
    commitBrowseState(
      {
        sortDirection: nextSortDirection,
      },
      'push',
    )
  }, [commitBrowseState, groupByRealm, sortDirection, sortKey, storage])

  const setGroupByRealm = useCallback(
    (next: boolean) => {
      writeAwakenerDatabaseBrowseSortPreferences(
        {sortKey, sortDirection, groupByRealm: next},
        storage,
      )
      setStoredSortRevision((current) => current + 1)
      commitBrowseState({groupByRealm: next}, 'push')
    },
    [commitBrowseState, sortDirection, sortKey, storage],
  )

  const resetFilters = useCallback(() => {
    commitBrowseState(
      {
        query: '',
        realmFilter: 'ALL',
        rarityFilter: 'ALL',
        typeFilter: 'ALL',
        availabilityFilter: 'ALL',
        gameplayFactionFilters: [],
        scalingSubstatFilters: [],
        scalingSubstatRoleFilter: 'ANY',
      },
      'push',
    )
  }, [commitBrowseState])

  return {
    groupByRealm,
    availabilityFilter,
    gameplayFactionFilters,
    query,
    rarityFilter,
    realmFilter,
    scalingSubstatRoleFilter,
    scalingSubstatFilters,
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
    setAvailabilityFilter,
    setGameplayFactionFilters,
    setScalingSubstatFilters,
    setScalingSubstatRoleFilter,
    toggleGameplayFactionFilter,
    toggleScalingSubstatFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
    resetFilters,
  }
}
