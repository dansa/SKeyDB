import {useCallback} from 'react'

import {useSearchParams} from 'react-router-dom'

import {
  DATABASE_BROWSE_DEFAULTS,
  parseDatabaseBrowseState,
  patchDatabaseBrowseState,
  type AvailabilityFilterId,
  type DatabaseBrowseState,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type SubstatScalingKey,
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
  const {
    availabilityFilter,
    groupByRealm,
    gameplayFactionFilters,
    query,
    rarityFilter,
    realmFilter,
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
        availabilityFilter: 'ALL',
        gameplayFactionFilters: [],
        scalingSubstatFilters: [],
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
    toggleGameplayFactionFilter,
    toggleScalingSubstatFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
    resetFilters,
  }
}
