import {useCallback, useEffect, useMemo, useRef} from 'react'

import type {NavigateFunction} from 'react-router-dom'

import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantPath,
  buildDatabasePossePath,
  buildDatabaseWheelPath,
} from '@/domain/database-paths'

import {databaseAwakeners, databaseCovenants, databasePosses, databaseWheels} from '../data'

interface UseEntityBrowseControllerOptions {
  activeEntity: DatabaseEntityId
  isDetailOpen: boolean
  locationPathname: string
  locationSearch: string
  navigate: NavigateFunction
}

type ActiveEntitySearchControlOptions = Omit<UseEntityBrowseControllerOptions, 'isDetailOpen'>

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
) {
  return (entryId: string) => {
    const entry = entries.find((candidate) => candidate.id === entryId)
    if (!entry) {
      return
    }

    void navigate({
      pathname: buildPath(entry),
      search: activeSearch,
    })
  }
}

function useActiveEntitySearchControls({
  activeEntity,
  locationPathname,
  locationSearch,
  navigate,
}: ActiveEntitySearchControlOptions) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const activeSearch = sanitizeDatabaseEntitySearch(activeEntity, locationSearch)
  const browsePath = buildDatabaseEntityBrowsePath(activeEntity)

  useEffect(() => {
    if (locationSearch === activeSearch) {
      return
    }

    void navigate(
      {
        pathname: locationPathname,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, locationPathname, locationSearch, navigate])

  return {
    activeSearch,
    browsePath,
    searchInputRef,
  }
}

export function useEntityBrowseController({
  activeEntity,
  isDetailOpen,
  locationPathname,
  locationSearch,
  navigate,
}: UseEntityBrowseControllerOptions) {
  const {activeSearch, browsePath, searchInputRef} = useActiveEntitySearchControls({
    activeEntity,
    locationPathname,
    locationSearch,
    navigate,
  })
  const openAwakenerDetail = useMemo(
    () =>
      createOpenDetailHandler(databaseAwakeners, buildDatabaseAwakenerPath, navigate, activeSearch),
    [activeSearch, navigate],
  )
  const openWheelDetail = useMemo(
    () => createOpenDetailHandler(databaseWheels, buildDatabaseWheelPath, navigate, activeSearch),
    [activeSearch, navigate],
  )
  const openPosseDetail = useMemo(
    () => createOpenDetailHandler(databasePosses, buildDatabasePossePath, navigate, activeSearch),
    [activeSearch, navigate],
  )
  const openCovenantDetail = useMemo(
    () =>
      createOpenDetailHandler(databaseCovenants, buildDatabaseCovenantPath, navigate, activeSearch),
    [activeSearch, navigate],
  )

  const closeDetail = useCallback(() => {
    void navigate({pathname: browsePath, search: activeSearch})
  }, [activeSearch, browsePath, navigate])

  return {
    activeEntity,
    activeSearch,
    browsePath,
    isDetailOpen,
    searchInputRef,
    openAwakenerDetail,
    openWheelDetail,
    openPosseDetail,
    openCovenantDetail,
    closeDetail,
  }
}

export type EntityBrowseController = ReturnType<typeof useEntityBrowseController>
