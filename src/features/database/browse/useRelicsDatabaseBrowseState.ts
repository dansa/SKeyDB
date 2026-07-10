import {useCallback, useMemo, useState} from 'react'

import {
  readDatabaseBrowsePreferences,
  writeRelicDatabaseDisplayPreferences,
} from '@/domain/database-browse-preferences'
import {
  getDefaultRelicDatabaseSortDirection,
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
  type RelicDatabaseBrowseState,
  type RelicDatabaseCategoryFilterId,
  type RelicDatabaseSortKey,
  type RelicDatabaseTierFilterId,
} from '@/domain/relic-database-browse-state'
import {
  RELIC_DATABASE_DISPLAY_SCOPE_IDS,
  type RelicDatabaseDisplayScopeId,
} from '@/domain/relic-database-display-scopes'
import {getBrowserLocalStorage} from '@/domain/storage'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function useRelicsDatabaseBrowseState() {
  const storage = useMemo(() => getBrowserLocalStorage(), [])
  const [displayScopes, setDisplayScopesState] = useState(
    () => readDatabaseBrowsePreferences(storage).relics.displayScopes,
  )
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<RelicDatabaseBrowseState>({
    parseState: parseRelicDatabaseBrowseState,
    patchState: patchRelicDatabaseBrowseState,
  })
  const {categoryFilter, query, sortDirection, sortKey, tierFilter} = browseState
  const queryActions = useBrowseQueryActions(query, commitBrowseState)

  const setCategoryFilter = useCallback(
    (next: RelicDatabaseCategoryFilterId) => {
      commitBrowseState({categoryFilter: next}, 'push')
    },
    [commitBrowseState],
  )
  const setTierFilter = useCallback(
    (next: RelicDatabaseTierFilterId) => {
      commitBrowseState({tierFilter: next}, 'push')
    },
    [commitBrowseState],
  )
  const setDisplayScopes = useCallback(
    (next: readonly RelicDatabaseDisplayScopeId[]) => {
      const normalized = RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) => next.includes(scope))
      writeRelicDatabaseDisplayPreferences({displayScopes: normalized}, storage)
      setDisplayScopesState(normalized)
    },
    [storage],
  )
  const toggleDisplayScope = useCallback(
    (scope: RelicDatabaseDisplayScopeId) => {
      setDisplayScopes(
        displayScopes.includes(scope)
          ? displayScopes.filter((activeScope) => activeScope !== scope)
          : [...displayScopes, scope],
      )
    },
    [displayScopes, setDisplayScopes],
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
    commitBrowseState({categoryFilter: 'ALL', query: '', tierFilter: 'ALL'}, 'push')
  }, [commitBrowseState])

  return {
    ...queryActions,
    categoryFilter,
    displayScopes,
    query,
    resetFilters,
    setCategoryFilter,
    setSortKey,
    setDisplayScopes,
    setTierFilter,
    sortDirection,
    sortKey,
    tierFilter,
    toggleDisplayScope,
    toggleSortDirection,
  }
}
