import {useCallback} from 'react'

type BrowseHistoryMode = 'push' | 'replace'

interface QueryState {
  query: string
}

interface UseBrowseQueryActionsResult {
  setQuery: (next: string) => void
  appendSearchCharacter: (key: string) => void
  removeSearchCharacter: () => void
  clearQuery: () => void
}

export function useBrowseQueryActions<TState extends QueryState>(
  query: string,
  commitBrowseState: (patch: Partial<TState>, historyMode: BrowseHistoryMode) => void,
): UseBrowseQueryActionsResult {
  const setQuery = useCallback(
    (next: string) => {
      commitBrowseState({query: next} as Partial<TState>, 'replace')
    },
    [commitBrowseState],
  )

  const appendSearchCharacter = useCallback(
    (key: string) => {
      commitBrowseState({query: query + key} as Partial<TState>, 'replace')
    },
    [commitBrowseState, query],
  )

  const removeSearchCharacter = useCallback(() => {
    commitBrowseState({query: query.slice(0, -1)} as Partial<TState>, 'replace')
  }, [commitBrowseState, query])

  const clearQuery = useCallback(() => {
    commitBrowseState({query: ''} as Partial<TState>, 'replace')
  }, [commitBrowseState])

  return {setQuery, appendSearchCharacter, removeSearchCharacter, clearQuery}
}
