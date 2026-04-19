import {useCallback} from 'react'

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
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<WheelsDatabaseBrowseState>({
    parseState: parseWheelsDatabaseBrowseState,
    patchState: patchWheelsDatabaseBrowseState,
  })
  const {mainstatFilter, query, rarityFilter, realmFilter, sortDirection, sortKey} = browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions<WheelsDatabaseBrowseState>(query, commitBrowseState)

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
      commitBrowseState(
        {
          sortKey: next,
          sortDirection: getDefaultWheelsDatabaseSortDirection(next),
        },
        'push',
      )
    },
    [commitBrowseState],
  )

  const toggleSortDirection = useCallback(() => {
    commitBrowseState(
      {
        sortDirection: sortDirection === 'ASC' ? 'DESC' : 'ASC',
      },
      'push',
    )
  }, [commitBrowseState, sortDirection])

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
  }
}
