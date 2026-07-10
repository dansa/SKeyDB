import {useCallback} from 'react'

import {
  getDefaultRelicDatabaseSortDirection,
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
  type RelicDatabaseBrowseState,
  type RelicDatabaseCategoryFilterId,
  type RelicDatabaseRarityFilterId,
  type RelicDatabaseSortKey,
} from '@/domain/relic-database-browse-state'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function useRelicsDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<RelicDatabaseBrowseState>({
    parseState: parseRelicDatabaseBrowseState,
    patchState: patchRelicDatabaseBrowseState,
  })
  const {categoryFilter, query, rarityFilter, sortDirection, sortKey} = browseState
  const queryActions = useBrowseQueryActions(query, commitBrowseState)

  const setCategoryFilter = useCallback(
    (next: RelicDatabaseCategoryFilterId) => {
      commitBrowseState({categoryFilter: next}, 'push')
    },
    [commitBrowseState],
  )
  const setRarityFilter = useCallback(
    (next: RelicDatabaseRarityFilterId) => {
      commitBrowseState({rarityFilter: next}, 'push')
    },
    [commitBrowseState],
  )
  const setSortKey = useCallback(
    (next: RelicDatabaseSortKey) => {
      commitBrowseState(
        {sortDirection: getDefaultRelicDatabaseSortDirection(next), sortKey: next},
        'replace',
      )
    },
    [commitBrowseState],
  )
  const toggleSortDirection = useCallback(() => {
    commitBrowseState({sortDirection: sortDirection === 'ASC' ? 'DESC' : 'ASC'}, 'replace')
  }, [commitBrowseState, sortDirection])
  const resetFilters = useCallback(() => {
    commitBrowseState({categoryFilter: 'ALL', query: '', rarityFilter: 'ALL'}, 'push')
  }, [commitBrowseState])

  return {
    ...queryActions,
    categoryFilter,
    query,
    rarityFilter,
    resetFilters,
    setCategoryFilter,
    setRarityFilter,
    setSortKey,
    sortDirection,
    sortKey,
    toggleSortDirection,
  }
}
