import {useSyncExternalStore} from 'react'

const MOBILE_FILTER_QUERY = '(max-width: 639.98px)'

function subscribeToMobileFilterMatch(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(MOBILE_FILTER_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => {
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

export function useMobileDatabaseFilters(): boolean {
  return useSyncExternalStore(
    subscribeToMobileFilterMatch,
    getMobileFilterMatch,
    getServerMobileFilterMatch,
  )
}

function getMobileFilterMatch(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return getServerMobileFilterMatch()
  }

  return window.matchMedia(MOBILE_FILTER_QUERY).matches
}

function getServerMobileFilterMatch(): boolean {
  return false
}
