import {useCallback, useEffect, useMemo, useRef} from 'react'

import type {NavigateFunction} from 'react-router'

import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantPath,
  buildDatabasePossePath,
  buildDatabaseRelicPath,
  buildDatabaseWheelPath,
} from '@/domain/database-paths'
import {
  createDatabaseDetailFromBrowseState,
  getDatabaseDetailBrowseOrigin,
  type DatabaseDetailBrowseOrigin,
} from '@/features/database/detail/database-detail-history'
import {
  getDatabaseDetailKindForEntity,
  preloadDatabaseDetail,
  preloadDatabaseDetailShell,
  type DatabaseDetailKind,
} from '@/features/database/detail/dbDetailRegistry'

import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseRelics,
  databaseWheels,
} from '../data'

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

function createOpenDetailHandler<TEntry extends {id: string}>(
  entries: readonly TEntry[],
  buildPath: (entry: TEntry) => string,
  navigate: NavigateFunction,
  activeSearch: string,
  locationState: unknown,
  originEntity: DatabaseEntityId,
  originPathname: string,
) {
  return (entryId: string) => {
    const entry = entries.find((candidate) => candidate.id === entryId)
    if (!entry) {
      return
    }

    void navigate(
      {
        pathname: buildPath(entry),
        search: activeSearch,
      },
      {
        state: createDatabaseDetailFromBrowseState(locationState, {
          entity: originEntity,
          pathname: originPathname,
          search: activeSearch,
        }),
      },
    )
  }
}

function createPreloadDetailHandler(kind: DatabaseDetailKind) {
  return (id: string) => {
    preloadDatabaseDetail(kind, id)
  }
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
  const activeDetailKind = getDatabaseDetailKindForEntity(activeEntity)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      preloadDatabaseDetailShell(activeDetailKind)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeDetailKind])

  const openAwakenerDetail = useMemo(
    () =>
      createOpenDetailHandler(
        databaseAwakeners,
        buildDatabaseAwakenerPath,
        navigate,
        activeSearch,
        locationState,
        activeEntity,
        browsePath,
      ),
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const openWheelDetail = useMemo(
    () =>
      createOpenDetailHandler(
        databaseWheels,
        buildDatabaseWheelPath,
        navigate,
        activeSearch,
        locationState,
        activeEntity,
        browsePath,
      ),
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const openPosseDetail = useMemo(
    () =>
      createOpenDetailHandler(
        databasePosses,
        buildDatabasePossePath,
        navigate,
        activeSearch,
        locationState,
        activeEntity,
        browsePath,
      ),
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const openCovenantDetail = useMemo(
    () =>
      createOpenDetailHandler(
        databaseCovenants,
        buildDatabaseCovenantPath,
        navigate,
        activeSearch,
        locationState,
        activeEntity,
        browsePath,
      ),
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const openRelicDetail = useMemo(
    () =>
      createOpenDetailHandler(
        databaseRelics,
        buildDatabaseRelicPath,
        navigate,
        activeSearch,
        locationState,
        activeEntity,
        browsePath,
      ),
    [activeEntity, activeSearch, browsePath, locationState, navigate],
  )
  const preloadAwakenerDetail = useMemo(() => createPreloadDetailHandler('awakener'), [])
  const preloadWheelDetail = useMemo(() => createPreloadDetailHandler('wheel'), [])
  const preloadPosseDetail = useMemo(() => createPreloadDetailHandler('posse'), [])
  const preloadCovenantDetail = useMemo(() => createPreloadDetailHandler('covenant'), [])
  const preloadRelicDetail = useMemo(() => createPreloadDetailHandler('relic'), [])

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
    openAwakenerDetail,
    openWheelDetail,
    openPosseDetail,
    openCovenantDetail,
    openRelicDetail,
    preloadAwakenerDetail,
    preloadWheelDetail,
    preloadPosseDetail,
    preloadCovenantDetail,
    preloadRelicDetail,
    closeDetail,
  }
}

export type EntityBrowseController = ReturnType<typeof useEntityBrowseController>
