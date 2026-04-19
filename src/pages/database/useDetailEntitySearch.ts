import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'

import {getSearchCaptureAction} from '@/pages/search-capture'

interface UseDetailEntitySearchOptions<TEntity> {
  items: TEntity[]
  searchItems: (items: TEntity[], query: string) => TEntity[]
  onSelectResult: (item: TEntity) => void
}

let searchCaptureSuppressionDepth = 0
const searchCaptureSuppressionListeners = new Set<() => void>()

function emitSearchCaptureSuppressionChange() {
  searchCaptureSuppressionListeners.forEach((listener) => {
    listener()
  })
}

function subscribeToSearchCaptureSuppression(listener: () => void) {
  searchCaptureSuppressionListeners.add(listener)
  return () => {
    searchCaptureSuppressionListeners.delete(listener)
  }
}

function getSearchCaptureSuppressionSnapshot() {
  return searchCaptureSuppressionDepth > 0
}

export function useSuppressDetailEntitySearchCapture() {
  useEffect(() => {
    searchCaptureSuppressionDepth += 1
    emitSearchCaptureSuppressionChange()

    return () => {
      searchCaptureSuppressionDepth = Math.max(0, searchCaptureSuppressionDepth - 1)
      emitSearchCaptureSuppressionChange()
    }
  }, [])
}

export function useDetailEntitySearch<TEntity>({
  items,
  searchItems,
  onSelectResult,
}: UseDetailEntitySearchOptions<TEntity>) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchActiveIndex, setSearchActiveIndex] = useState(0)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResults = useMemo(
    () => (searchQuery.trim().length > 0 ? searchItems(items, searchQuery) : []),
    [items, searchItems, searchQuery],
  )
  const isSearchCaptureSuppressed = useSyncExternalStore(
    subscribeToSearchCaptureSuppression,
    getSearchCaptureSuppressionSnapshot,
    getSearchCaptureSuppressionSnapshot,
  )
  const activeSearchIndex =
    searchResults.length === 0 ? 0 : Math.min(searchActiveIndex, searchResults.length - 1)

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback((blurInput = false) => {
    setIsSearchOpen(false)
    if (blurInput) {
      searchInputRef.current?.blur()
    }
  }, [])

  const clearSearch = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchActiveIndex(0)
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
    setIsSearchOpen(true)
    setSearchQuery(value)
    setSearchActiveIndex(0)
  }, [])

  useEffect(() => {
    function handleGlobalSearchCapture(event: KeyboardEvent) {
      if (isSearchCaptureSuppressed) {
        return
      }

      const action = getSearchCaptureAction({
        currentSearchValue: searchInputRef.current?.value ?? searchQuery,
        event,
      })
      if (!action) {
        return
      }

      event.preventDefault()

      if (action.kind === 'delete') {
        setSearchQuery((previous) => previous.slice(0, -1))
        setIsSearchOpen(true)
        focusSearchInput()
        return
      }

      if (action.kind !== 'character') {
        return
      }

      setSearchQuery((previous) => previous + action.key)
      setIsSearchOpen(true)
      focusSearchInput()
    }

    window.addEventListener('keydown', handleGlobalSearchCapture)
    return () => {
      window.removeEventListener('keydown', handleGlobalSearchCapture)
    }
  }, [focusSearchInput, isSearchCaptureSuppressed, searchQuery])

  const handleSearchInputKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'ArrowDown') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        setSearchActiveIndex((previous) => (previous + 1) % searchResults.length)
        return
      }
      if (event.key === 'ArrowUp') {
        if (searchResults.length === 0) {
          return
        }
        event.preventDefault()
        setSearchActiveIndex((previous) =>
          previous === 0 ? searchResults.length - 1 : previous - 1,
        )
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
