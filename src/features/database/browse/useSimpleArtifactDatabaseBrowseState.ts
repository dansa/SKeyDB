import {useCallback} from 'react'

import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
  type CovenantDatabaseBrowseState,
  type PosseDatabaseBrowseState,
  type PosseDatabaseRealmFilterId,
} from '@/domain/simple-artifact-database-browse-state'

import {useBrowseQueryActions} from './useBrowseQueryActions'
import {useUrlBackedBrowseState} from './useDatabaseBrowseState'

export function usePosseDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<PosseDatabaseBrowseState>({
    parseState: parsePosseDatabaseBrowseState,
    patchState: patchPosseDatabaseBrowseState,
  })
  const {query, realmFilter} = browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions(query, commitBrowseState)

  const setRealmFilter = useCallback(
    (next: PosseDatabaseRealmFilterId) => {
      commitBrowseState({realmFilter: next}, 'push')
    },
    [commitBrowseState],
  )

  const resetFilters = useCallback(() => {
    commitBrowseState({query: '', realmFilter: 'ALL'}, 'push')
  }, [commitBrowseState])

  return {
    query,
    realmFilter,
    setQuery,
    appendSearchCharacter,
    removeSearchCharacter,
    clearQuery,
    setRealmFilter,
    resetFilters,
  }
}

export function useCovenantDatabaseBrowseState() {
  const {browseState, commitBrowseState} = useUrlBackedBrowseState<CovenantDatabaseBrowseState>({
    parseState: parseCovenantDatabaseBrowseState,
    patchState: patchCovenantDatabaseBrowseState,
  })
  const {query} = browseState
  const {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery} =
    useBrowseQueryActions(query, commitBrowseState)

  const resetFilters = useCallback(() => {
    commitBrowseState({query: ''}, 'push')
  }, [commitBrowseState])

  return {
    query,
    setQuery,
    appendSearchCharacter,
    removeSearchCharacter,
    clearQuery,
    resetFilters,
  }
}
