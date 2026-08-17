import {useCallback, useEffect, useRef} from 'react'

import type {NavigateFunction} from 'react-router'

import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  createDatabaseDetailFromBrowseState,
  getDatabaseDetailBrowseOrigin,
  type DatabaseDetailBrowseOrigin,
} from '@/features/database/detail/database-detail-history'

import {
  preloadDatabaseDetail,
  preloadDatabaseDetailShell,
  type DatabaseDetailKind,
} from './databaseDetailPreload'

interface UseEntityBrowseControllerOptions {
  activeEntity: DatabaseEntityId
  browseOrigin: DatabaseDetailBrowseOrigin | null
  isDetailOpen: boolean
  locationPathname: string
  locationSearch: string
  locationState: unknown
  navigate: NavigateFunction
  routeEntity: DatabaseEntityId
}

type ActiveEntitySearchControlOptions = UseEntityBrowseControllerOptions

export interface EntitySearchActions {
  appendSearchCharacter: (character: string) => void
  clearQuery: () => void
  removeSearchCharacter: () => void
}

function useActiveEntitySearchControls({
  activeEntity,
  browseOrigin,
  isDetailOpen,
  locationPathname,
  locationSearch,
  locationState,
  navigate,
  routeEntity,
}: ActiveEntitySearchControlOptions) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const activeSearch = sanitizeDatabaseEntitySearch(
    activeEntity,
    browseOrigin?.search ?? locationSearch,
  )
  const detailSearch = sanitizeDatabaseEntitySearch(routeEntity, locationSearch, {
    includeDetailState: isDetailOpen,
  })
  const browsePath = browseOrigin?.pathname ?? buildDatabaseEntityBrowsePath(activeEntity)

  useEffect(() => {
    if (locationSearch === detailSearch) {
      return
    }

    void navigate(
      {
        pathname: locationPathname,
        search: detailSearch,
      },
      {replace: true, state: locationState},
    )
  }, [detailSearch, locationPathname, locationSearch, locationState, navigate])

  return {
    activeSearch,
    browsePath,
    detailSearch,
    searchInputRef,
  }
}

export function useEntityBrowseController({
  activeEntity,
  browseOrigin,
  isDetailOpen,
  locationPathname,
  locationSearch,
  locationState,
  navigate,
  routeEntity,
}: UseEntityBrowseControllerOptions) {
  const {activeSearch, browsePath, detailSearch, searchInputRef} = useActiveEntitySearchControls({
    activeEntity,
    browseOrigin,
    isDetailOpen,
    locationPathname,
    locationSearch,
    locationState,
    navigate,
    routeEntity,
  })
  const openDetail = useCallback(
    (pathname: string) => {
      void navigate(
        {pathname, search: activeSearch},
        {
          state: createDatabaseDetailFromBrowseState(locationState, {
            entity: activeEntity,
            pathname: browsePath,
            search: activeSearch,
          }),
        },
      )
    },
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const preloadDetail = useCallback((kind: DatabaseDetailKind, id: string) => {
    preloadDatabaseDetail(kind, id)
  }, [])
  const warmDetailShell = useCallback((kind: DatabaseDetailKind) => {
    preloadDatabaseDetailShell(kind)
  }, [])

  const closeDetail = useCallback(() => {
    if (getDatabaseDetailBrowseOrigin(locationState)) {
      void navigate(-1)
      return
    }

    void navigate(
      {
        pathname: browsePath,
        search: sanitizeDatabaseEntitySearch(activeEntity, activeSearch),
      },
      {replace: true},
    )
  }, [activeEntity, activeSearch, browsePath, locationState, navigate])

  return {
    activeEntity,
    activeSearch,
    browsePath,
    detailSearch,
    isDetailOpen,
    searchInputRef,
    openDetail,
    preloadDetail,
    warmDetailShell,
    closeDetail,
  }
}

export type EntityBrowseController = ReturnType<typeof useEntityBrowseController>
