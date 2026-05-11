import {useCallback} from 'react'

type BrowseHistoryMode = 'push' | 'replace'

interface QueryState {
  query: string
}

type CommitQueryState = (patch: QueryState, historyMode: BrowseHistoryMode) => void

interface UseBrowseQueryActionsResult {
  setQuery: (next: string) => void
  appendSearchCharacter: (key: string) => void
  removeSearchCharacter: () => void
  clearQuery: () => void
}

export function useBrowseQueryActions(
  query: string,
  commitBrowseState: CommitQueryState,
): UseBrowseQueryActionsResult {
  const setQuery = useCallback(
    (next: string) => {
      commitBrowseState({query: next}, 'replace')
    },
    [commitBrowseState],
  )

  const appendSearchCharacter = useCallback(
    (key: string) => {
      commitBrowseState({query: query + key}, 'replace')
    },
    [commitBrowseState, query],
  )

  const removeSearchCharacter = useCallback(() => {
    commitBrowseState({query: query.slice(0, -1)}, 'replace')
  }, [commitBrowseState, query])

  const clearQuery = useCallback(() => {
    commitBrowseState({query: ''}, 'replace')
  }, [commitBrowseState])

  return {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery}
}
