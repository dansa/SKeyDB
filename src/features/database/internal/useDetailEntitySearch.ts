import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {preferencesStore} from '@/stores/preferencesStore'
import {getSearchCaptureAction} from '@/ui/search/search-capture'

interface UseDetailEntitySearchOptions<TEntity> {
  items: TEntity[]
  searchItems: (items: TEntity[], query: string) => TEntity[]
  onSelectResult: (item: TEntity) => void
}

interface SearchState {
  isOpen: boolean
  query: string
  activeIndex: number
}

type SearchAction =
  | {type: 'open'}
  | {type: 'close'}
  | {type: 'clear'}
  | {type: 'queryChanged'; query: string}
  | {type: 'appendCharacter'; key: string}
  | {type: 'deleteCharacter'}
  | {type: 'moveActiveIndex'; activeIndex: number}

const initialSearchState: SearchState = {
  activeIndex: 0,
  isOpen: false,
  query: '',
}

function searchStateReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'open':
      return state.isOpen ? state : {...state, isOpen: true}
    case 'close':
      return state.isOpen ? {...state, isOpen: false} : state
    case 'clear':
      return initialSearchState
    case 'queryChanged':
      return {
        activeIndex: 0,
        isOpen: true,
        query: action.query,
      }
    case 'appendCharacter':
      return {
        activeIndex: state.activeIndex,
        isOpen: true,
        query: state.query + action.key,
      }
    case 'deleteCharacter':
      return {
        activeIndex: state.activeIndex,
        isOpen: true,
        query: state.query.slice(0, -1),
      }
    case 'moveActiveIndex':
      return {...state, activeIndex: action.activeIndex}
  }
}

export function useSuppressDetailEntitySearchCapture() {
  useEffect(() => {
    return suppressDetailEntitySearchCapture()
  }, [])
}

export function suppressDetailEntitySearchCapture() {
  const {decrementDetailSearchCaptureSuppression, incrementDetailSearchCaptureSuppression} =
    preferencesStore.getState()

  incrementDetailSearchCaptureSuppression()

  return () => {
    decrementDetailSearchCaptureSuppression()
  }
}

export function useDetailEntitySearch<TEntity>({
  items,
  searchItems,
  onSelectResult,
}: UseDetailEntitySearchOptions<TEntity>) {
  const [searchState, dispatchSearchState] = useReducer(searchStateReducer, initialSearchState)
  const {activeIndex: searchActiveIndex, isOpen: isSearchOpen, query: searchQuery} = searchState
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchQueryRef = useRef(searchQuery)
  useEffect(() => {
    searchQueryRef.current = searchQuery
  }, [searchQuery])
  const searchResults = useMemo(
    () => (searchQuery.trim().length > 0 ? searchItems(items, searchQuery) : []),
    [items, searchItems, searchQuery],
  )
  const activeSearchIndex =
    searchResults.length === 0 ? 0 : Math.min(searchActiveIndex, searchResults.length - 1)

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const openSearch = useCallback(() => {
    dispatchSearchState({type: 'open'})
  }, [])

  const closeSearch = useCallback((blurInput = false) => {
    dispatchSearchState({type: 'close'})
    if (blurInput) {
      searchInputRef.current?.blur()
    }
  }, [])

  const clearSearch = useCallback(() => {
    dispatchSearchState({type: 'clear'})
  }, [])

  const handleSelectResult = useCallback(
    (nextItem: TEntity) => {
      onSelectResult(nextItem)
      clearSearch()
      searchInputRef.current?.blur()
    },
    [clearSearch, onSelectResult],
  )

  const handleSearchQueryChange = useCallback((value: string) => {
    dispatchSearchState({type: 'queryChanged', query: value})
  }, [])

  useEffect(() => {
    function handleGlobalSearchCapture(event: KeyboardEvent) {
      if (preferencesStore.getState().isDetailSearchCaptureSuppressed()) {
        return
      }

      const action = getSearchCaptureAction({
        currentSearchValue: searchInputRef.current?.value ?? searchQueryRef.current,
        event,
      })
      if (!action) {
        return
      }

      event.preventDefault()

      if (action.kind === 'delete') {
        dispatchSearchState({type: 'deleteCharacter'})
        focusSearchInput()
        return
      }

      if (action.kind !== 'character') {
        return
      }

      dispatchSearchState({key: action.key, type: 'appendCharacter'})
      focusSearchInput()
    }

    window.addEventListener('keydown', handleGlobalSearchCapture)
    return () => {
      window.removeEventListener('keydown', handleGlobalSearchCapture)
    }
  }, [focusSearchInput])

  const handleSearchInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        dispatchSearchState({
          activeIndex: (activeSearchIndex + 1) % searchResults.length,
          type: 'moveActiveIndex',
        })
        return
      }
      if (event.key === 'ArrowUp') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        dispatchSearchState({
          activeIndex: activeSearchIndex === 0 ? searchResults.length - 1 : activeSearchIndex - 1,
          type: 'moveActiveIndex',
        })
        return
      }
      if (event.key === 'Enter') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        handleSelectResult(searchResults[activeSearchIndex])
      }
    },
    [activeSearchIndex, handleSelectResult, searchResults],
  )

  return {
    activeSearchIndex,
    clearSearch,
    closeSearch,
    handleSearchInputKeyDown,
    handleSearchQueryChange,
    handleSelectResult,
    isSearchOpen,
    openSearch,
    searchContainerRef,
    searchInputRef,
    searchQuery,
    searchResults,
  }
}
