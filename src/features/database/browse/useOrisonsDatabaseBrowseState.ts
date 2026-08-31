import {useCallback} from 'react'

import {
  parseOrisonDatabaseBrowseState,
  patchOrisonDatabaseBrowseState,
  type OrisonTierFilter,
  type OrisonTypeFilter,
} from '@/domain/orison-database-browse-state'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function useOrisonsDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState({
    parseState: parseOrisonDatabaseBrowseState,
    patchState: patchOrisonDatabaseBrowseState,
  })
  const queryActions = useBrowseQueryActions(browseState.query, commitBrowseState)
  const setTypeFilter = useCallback(
    (typeFilter: OrisonTypeFilter) => {
      commitBrowseState({typeFilter}, 'push')
    },
    [commitBrowseState],
  )
  const setTierFilter = useCallback(
    (tierFilter: OrisonTierFilter) => {
      commitBrowseState({tierFilter}, 'push')
    },
    [commitBrowseState],
  )
  const resetFilters = useCallback(() => {
    commitBrowseState({query: '', typeFilter: 'ALL', tierFilter: 'ALL'}, 'push')
  }, [commitBrowseState])
  return {...browseState, ...queryActions, setTypeFilter, setTierFilter, resetFilters}
}
