import {useEffect, useMemo, useRef} from 'react'

import type {NavigateFunction} from 'react-router-dom'

import {searchCovenants} from '@/domain/covenants-search'
import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantPath,
  buildDatabasePossePath,
  buildDatabaseWheelPath,
} from '@/domain/database-paths'
import {searchPosses} from '@/domain/posses-search'
import {
  buildAwakenerActiveFilterChips,
  buildCovenantActiveFilterChips,
  buildPosseActiveFilterChips,
  buildWheelActiveFilterChips,
} from '@/features/database/internal/database-active-filter-chips'
import {useDatabaseViewModel} from '@/features/database/internal/useDatabaseViewModel'
import {useWheelsDatabaseViewModel} from '@/features/database/internal/useWheelsDatabaseViewModel'
import {useGlobalSearchCapture} from '@/ui/search/useGlobalSearchCapture'

import {databaseAwakeners, databaseCovenants, databasePosses, databaseWheels} from '../data'
import {useDatabaseBrowseState} from './useDatabaseBrowseState'
import {
  useCovenantDatabaseBrowseState,
  usePosseDatabaseBrowseState,
} from './useSimpleArtifactDatabaseBrowseState'
import {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

interface UseEntityBrowseControllerOptions {
  activeEntity: DatabaseEntityId
  isDetailOpen: boolean
  locationPathname: string
  locationSearch: string
  navigate: NavigateFunction
}

export function useEntityBrowseController({
  activeEntity,
  isDetailOpen,
  locationPathname,
  locationSearch,
  navigate,
}: UseEntityBrowseControllerOptions) {
  const awakeners = useDatabaseBrowseState()
  const awakenerViewModel = useDatabaseViewModel(databaseAwakeners, awakeners)
  const wheels = useWheelsDatabaseBrowseState()
  const wheelViewModel = useWheelsDatabaseViewModel(databaseWheels, wheels)
  const posses = usePosseDatabaseBrowseState()
  const covenants = useCovenantDatabaseBrowseState()
  const filteredPosses = useMemo(() => {
    const searched = searchPosses(databasePosses, posses.query)
    return posses.realmFilter === 'ALL'
      ? searched
      : searched.filter((posse) => posse.realm === posses.realmFilter)
  }, [posses.query, posses.realmFilter])
  const filteredCovenants = useMemo(
    () => searchCovenants(databaseCovenants, covenants.query),
    [covenants.query],
  )
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

  const searchActionsByEntity = {
    awakeners: awakeners,
    wheels,
    posses,
    covenants,
  }
  const activeSearchActions = searchActionsByEntity[activeEntity]

  useGlobalSearchCapture({
    enabled: !isDetailOpen,
    searchInputRef,
    onAppendCharacter: activeSearchActions.appendSearchCharacter,
    onRemoveCharacter: activeSearchActions.removeSearchCharacter,
    onClearSearch: activeSearchActions.clearQuery,
  })

  function openAwakenerDetail(awakenerId: string) {
    const awakener = databaseAwakeners.find((entry) => entry.id === awakenerId)
    if (!awakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(awakener),
      search: activeSearch,
    })
  }

  function openWheelDetail(wheelId: string) {
    const wheel = databaseWheels.find((entry) => entry.id === wheelId)
    if (!wheel) {
      return
    }
    void navigate({
      pathname: buildDatabaseWheelPath(wheel),
      search: activeSearch,
    })
  }

  function openPosseDetail(posseId: string) {
    const posse = databasePosses.find((entry) => entry.id === posseId)
    if (!posse) {
      return
    }
    void navigate({
      pathname: buildDatabasePossePath(posse),
      search: activeSearch,
    })
  }

  function openCovenantDetail(covenantId: string) {
    const covenant = databaseCovenants.find((entry) => entry.id === covenantId)
    if (!covenant) {
      return
    }
    void navigate({
      pathname: buildDatabaseCovenantPath(covenant),
      search: activeSearch,
    })
  }

  function closeDetail() {
    void navigate({pathname: browsePath, search: activeSearch})
  }

  return {
    activeEntity,
    activeSearch,
    browsePath,
    searchInputRef,
    awakeners: {
      state: awakeners,
      viewModel: awakenerViewModel,
      activeFilterChips: buildAwakenerActiveFilterChips(awakeners, {
        clearQuery: awakeners.clearQuery,
        setRealmFilter: awakeners.setRealmFilter,
        setRarityFilter: awakeners.setRarityFilter,
        setTypeFilter: awakeners.setTypeFilter,
      }),
    },
    wheels: {
      state: wheels,
      viewModel: wheelViewModel,
      activeFilterChips: buildWheelActiveFilterChips(wheels, {
        clearQuery: wheels.clearQuery,
        setRealmFilter: wheels.setRealmFilter,
        setRarityFilter: wheels.setRarityFilter,
        setMainstatFilter: wheels.setMainstatFilter,
      }),
    },
    posses: {
      state: posses,
      records: filteredPosses,
      activeFilterChips: buildPosseActiveFilterChips(posses, {
        clearQuery: posses.clearQuery,
        setRealmFilter: posses.setRealmFilter,
      }),
    },
    covenants: {
      state: covenants,
      records: filteredCovenants,
      activeFilterChips: buildCovenantActiveFilterChips(covenants, {
        clearQuery: covenants.clearQuery,
      }),
    },
    openAwakenerDetail,
    openWheelDetail,
    openPosseDetail,
    openCovenantDetail,
    closeDetail,
  }
}

export type EntityBrowseController = ReturnType<typeof useEntityBrowseController>
