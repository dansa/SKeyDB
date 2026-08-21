import {useCallback, useMemo, useState} from 'react'

import {useSearchParams} from 'react-router'

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
  type AwakenerScalingSubstatFilter,
  type AwakenerScalingSubstatFilterRole,
  type DatabaseBrowseState,
  type GenderFilterId,
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
interface IncludeSortParamsPatchOptions {
  includeSortParams?: boolean
}

interface UseUrlBackedBrowseStateOptions<TState, TPatchOptions = never> {
  parseState: (searchParams: URLSearchParams) => TState
  patchState: (
    searchParams: URLSearchParams,
    patch: Partial<TState>,
    options?: TPatchOptions,
  ) => URLSearchParams
}

export function useUrlBackedBrowseState<TState, TPatchOptions = never>({
  parseState,
  patchState,
}: UseUrlBackedBrowseStateOptions<TState, TPatchOptions>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const browseState = parseState(searchParams)

  const commitBrowseState = useCallback(
    (patch: Partial<TState>, historyMode: BrowseHistoryMode, options?: TPatchOptions) => {
      const nextParams = patchState(searchParams, patch, options)
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
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<
    DatabaseBrowseState,
    IncludeSortParamsPatchOptions
  >({
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
    patchState: (searchParams, patch, options) =>
      patchDatabaseBrowseState(searchParams, patch, {
        includeSortParams: options?.includeSortParams ?? hasAwakenerSortSearchParams(searchParams),
      }),
  })
  const {
    availabilityFilter,
    genderFilter,
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

  const setGenderFilter = useCallback(
    (next: GenderFilterId) => {
      commitBrowseState({genderFilter: next}, 'push')
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
    (next: AwakenerScalingSubstatFilter[]) => {
      commitBrowseState({scalingSubstatFilters: next}, 'push')
    },
    [commitBrowseState],
  )

  const toggleScalingSubstatFilter = useCallback(
    (filter: SubstatScalingKey) => {
      const exists = scalingSubstatFilters.some((value) => value.key === filter)
      const next = exists
        ? scalingSubstatFilters.filter((value) => value.key !== filter)
        : [...scalingSubstatFilters, {key: filter, role: 'ANY' as const}]
      setScalingSubstatFilters(next)
    },
    [scalingSubstatFilters, setScalingSubstatFilters],
  )

  const setScalingSubstatFilterRole = useCallback(
    (filter: SubstatScalingKey, role: AwakenerScalingSubstatFilterRole) => {
      setScalingSubstatFilters(
        scalingSubstatFilters.map((value) => (value.key === filter ? {...value, role} : value)),
      )
    },
    [scalingSubstatFilters, setScalingSubstatFilters],
  )

  const removeScalingSubstatFilter = useCallback(
    (filter: SubstatScalingKey) => {
      setScalingSubstatFilters(scalingSubstatFilters.filter((value) => value.key !== filter))
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
      commitBrowseState({sortKey: next}, 'replace', {includeSortParams: false})
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
      'replace',
      {includeSortParams: false},
    )
  }, [commitBrowseState, groupByRealm, sortDirection, sortKey, storage])

  const setGroupByRealm = useCallback(
    (next: boolean) => {
      writeAwakenerDatabaseBrowseSortPreferences(
        {sortKey, sortDirection, groupByRealm: next},
        storage,
      )
      setStoredSortRevision((current) => current + 1)
      commitBrowseState({groupByRealm: next}, 'replace', {includeSortParams: false})
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
        genderFilter: 'ALL',
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
    genderFilter,
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
    setGenderFilter,
    setGameplayFactionFilters,
    setScalingSubstatFilters,
    toggleGameplayFactionFilter,
    toggleScalingSubstatFilter,
    setScalingSubstatFilterRole,
    removeScalingSubstatFilter,
    setSortKey,
    toggleSortDirection,
    setGroupByRealm,
    resetFilters,
  }
}
