import {useCallback, useEffect, useMemo, type ComponentType, type ReactNode} from 'react'

import {useLocation, useNavigate, useParams, type NavigateFunction} from 'react-router'

import './database.css'

import {resolvePublicRoute} from '@/data-access/public-data/routeResolver'
import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import {resolveDatabaseDetailDefaultAwakenerTab} from '@/domain/database-detail-preferences'
import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantBrowsePath,
  buildDatabaseCovenantPath,
  buildDatabasePosseBrowsePath,
  buildDatabasePossePath,
  buildDatabaseRelicBrowsePath,
  buildDatabaseRelicPath,
  buildDatabaseWheelBrowsePath,
  buildDatabaseWheelPath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  findAwakenerByDatabaseSlug,
  findCovenantByDatabaseSlug,
  findPosseByDatabaseSlug,
  findRelicByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {Relic} from '@/domain/relics'
import {getBrowserLocalStorage} from '@/domain/storage'
import type {Wheel} from '@/domain/wheels'

import {
  AwakenersBrowse,
  CovenantsBrowse,
  PossesBrowse,
  RelicsBrowse,
  WheelsBrowse,
} from './browse/EntityBrowseViews'
import {useEntityBrowseController} from './browse/useEntityBrowseController'
import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseRelics,
  databaseWheels,
} from './data'
import {DatabaseLayout} from './DatabaseLayout'
import type {DatabaseDetailResultSet} from './detail/database-detail-result-navigation'
import {DbDetailModalHost} from './detail/DbDetailModalHost'

type EntityBrowseComponent = ComponentType<{
  controller: ReturnType<typeof useEntityBrowseController>
  renderDetailModalHost: (resultSet: DatabaseDetailResultSet) => ReactNode
}>

const entityBrowseComponents: Record<DatabaseEntityId, EntityBrowseComponent> = {
  awakeners: AwakenersBrowse,
  covenants: CovenantsBrowse,
  posses: PossesBrowse,
  relics: RelicsBrowse,
  wheels: WheelsBrowse,
}

function getActiveDatabaseEntity(pathname: string): DatabaseEntityId {
  if (pathname.startsWith(buildDatabaseRelicBrowsePath())) {
    return 'relics'
  }
  if (pathname.startsWith(buildDatabaseCovenantBrowsePath())) {
    return 'covenants'
  }
  if (pathname.startsWith(buildDatabasePosseBrowsePath())) {
    return 'posses'
  }
  if (pathname.startsWith(buildDatabaseWheelBrowsePath())) {
    return 'wheels'
  }
  return 'awakeners'
}

function buildCanonicalAwakenerRoutePath(
  awakener: Awakener,
  awakenerSlug: string | undefined,
  tab: DatabaseAwakenerTab,
): string {
  const normalizedSlug = awakenerSlug?.trim().toLowerCase()
  const routeResolution = normalizedSlug ? resolvePublicRoute('awakeners', normalizedSlug) : null
  const basePath =
    routeResolution?.status !== 'notFound' && routeResolution?.ref.id === awakener.id
      ? routeResolution.canonicalPath
      : buildDatabaseAwakenerPath(awakener)

  const visibleTab = resolveDatabaseAwakenerVisibleTab(tab)
  return visibleTab === DEFAULT_DATABASE_AWAKENER_TAB ? basePath : `${basePath}/${visibleTab}`
}

interface DetailRouteCorrectionParams {
  activeSearch: string
  browsePath: string
  canonicalPath: string | null
  hasSelectedDetail: boolean
  locationPathname: string
  navigate: NavigateFunction
  slug: string | undefined
}

function useDetailRouteCorrection({
  activeSearch,
  browsePath,
  canonicalPath,
  hasSelectedDetail,
  locationPathname,
  navigate,
  slug,
}: DetailRouteCorrectionParams) {
  useEffect(() => {
    // React Router owns URL state; this reconciles invalid deep links after route data resolves.
    if (slug && !hasSelectedDetail) {
      void navigate(
        {
          pathname: browsePath,
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, browsePath, hasSelectedDetail, navigate, slug])

  useEffect(() => {
    if (!slug || !hasSelectedDetail || !canonicalPath) {
      return
    }
    if (locationPathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, canonicalPath, hasSelectedDetail, locationPathname, navigate, slug])
}

interface DatabasePageProps {
  routeEntity?: DatabaseEntityId
}

export function DatabasePage({routeEntity}: DatabasePageProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const {awakenerSlug, covenantSlug, posseSlug, relicSlug, tabSlug, wheelSlug} = useParams()
  const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)
  const selectedWheel = findWheelByDatabaseSlug(databaseWheels, wheelSlug)
  const selectedPosse = findPosseByDatabaseSlug(databasePosses, posseSlug)
  const selectedCovenant = findCovenantByDatabaseSlug(databaseCovenants, covenantSlug)
  const selectedRelic = findRelicByDatabaseSlug(databaseRelics, relicSlug)
  const selectedRelicVariantId = new URLSearchParams(location.search).get('variant') ?? undefined
  const detailPreferenceStorage = useMemo(() => getBrowserLocalStorage(), [])
  const selectedTab = tabSlug
    ? resolveDatabaseAwakenerVisibleTab(resolveDatabaseAwakenerTab(tabSlug))
    : resolveDatabaseDetailDefaultAwakenerTab(undefined, detailPreferenceStorage)
  const activeEntity = routeEntity ?? getActiveDatabaseEntity(location.pathname)
  const browseController = useEntityBrowseController({
    activeEntity,
    isDetailOpen: Boolean(
      selectedAwakener ?? selectedWheel ?? selectedPosse ?? selectedCovenant ?? selectedRelic,
    ),
    locationPathname: location.pathname,
    locationSearch: location.search,
    navigate,
  })
  const activeSearch = browseController.activeSearch
  const canonicalAwakenerPath =
    awakenerSlug && selectedAwakener
      ? buildCanonicalAwakenerRoutePath(selectedAwakener, awakenerSlug, selectedTab)
      : null
  const canonicalWheelPath =
    wheelSlug && selectedWheel ? buildDatabaseWheelPath(selectedWheel) : null
  const canonicalPossePath =
    posseSlug && selectedPosse ? buildDatabasePossePath(selectedPosse) : null
  const canonicalCovenantPath =
    covenantSlug && selectedCovenant ? buildDatabaseCovenantPath(selectedCovenant) : null
  const canonicalRelicPath =
    relicSlug && selectedRelic ? buildDatabaseRelicPath(selectedRelic) : null

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseEntityBrowsePath('awakeners'),
    canonicalPath: canonicalAwakenerPath,
    hasSelectedDetail: Boolean(selectedAwakener),
    locationPathname: location.pathname,
    navigate,
    slug: awakenerSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseWheelBrowsePath(),
    canonicalPath: canonicalWheelPath,
    hasSelectedDetail: Boolean(selectedWheel),
    locationPathname: location.pathname,
    navigate,
    slug: wheelSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabasePosseBrowsePath(),
    canonicalPath: canonicalPossePath,
    hasSelectedDetail: Boolean(selectedPosse),
    locationPathname: location.pathname,
    navigate,
    slug: posseSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseCovenantBrowsePath(),
    canonicalPath: canonicalCovenantPath,
    hasSelectedDetail: Boolean(selectedCovenant),
    locationPathname: location.pathname,
    navigate,
    slug: covenantSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseRelicBrowsePath(),
    canonicalPath: canonicalRelicPath,
    hasSelectedDetail: Boolean(selectedRelic),
    locationPathname: location.pathname,
    navigate,
    slug: relicSlug,
  })

  const closeDetail = browseController.closeDetail
  const routeDetailItem = useMemo(
    () =>
      selectedAwakener
        ? ({kind: 'awakener', item: selectedAwakener, activeTab: selectedTab} as const)
        : selectedWheel
          ? ({kind: 'wheel', item: selectedWheel} as const)
          : selectedPosse
            ? ({kind: 'posse', item: selectedPosse} as const)
            : selectedCovenant
              ? ({kind: 'covenant', item: selectedCovenant} as const)
              : selectedRelic
                ? ({
                    kind: 'relic',
                    item: selectedRelic,
                    variantId: selectedRelicVariantId,
                  } as const)
                : null,
    [
      selectedAwakener,
      selectedCovenant,
      selectedPosse,
      selectedRelic,
      selectedRelicVariantId,
      selectedTab,
      selectedWheel,
    ],
  )

  const handleDetailTabChange = useCallback(
    (nextTab: DatabaseAwakenerTab) => {
      if (!selectedAwakener) {
        return
      }
      void navigate({
        pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
        search: activeSearch,
      })
    },
    [activeSearch, navigate, selectedAwakener],
  )

  const handleModalAwakenerSelect = useCallback(
    (
      nextAwakener: Pick<Awakener, 'id' | 'name'>,
      nextTab: DatabaseAwakenerTab = DEFAULT_DATABASE_AWAKENER_TAB,
    ) => {
      void navigate({
        pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
        search: sanitizeDatabaseEntitySearch('awakeners', activeSearch),
      })
    },
    [activeSearch, navigate],
  )

  const handleModalWheelSelect = useCallback(
    (nextWheel: Pick<Wheel, 'id' | 'name'>) => {
      void navigate({
        pathname: buildDatabaseWheelPath(nextWheel),
        search: sanitizeDatabaseEntitySearch('wheels', activeSearch),
      })
    },
    [activeSearch, navigate],
  )

  const handleModalCovenantSelect = useCallback(
    (nextCovenant: Pick<Covenant, 'id' | 'name'>) => {
      void navigate({
        pathname: buildDatabaseCovenantPath(nextCovenant),
        search: sanitizeDatabaseEntitySearch('covenants', activeSearch),
      })
    },
    [activeSearch, navigate],
  )

  const handleModalPosseSelect = useCallback(
    (nextPosse: {id: string; name: string}) => {
      void navigate({
        pathname: buildDatabasePossePath(nextPosse),
        search: sanitizeDatabaseEntitySearch('posses', activeSearch),
      })
    },
    [activeSearch, navigate],
  )

  const handleModalRelicSelect = useCallback(
    (nextRelic: Pick<Relic, 'id' | 'name'>) => {
      void navigate({
        pathname: buildDatabaseRelicPath(nextRelic),
        search: sanitizeDatabaseEntitySearch('relics', activeSearch),
      })
    },
    [activeSearch, navigate],
  )

  const handleRelicVariantChange = useCallback(
    (variantId?: string) => {
      const nextParams = new URLSearchParams(activeSearch)
      if (variantId) {
        nextParams.set('variant', variantId)
      } else {
        nextParams.delete('variant')
      }
      void navigate(
        {
          pathname: location.pathname,
          search: nextParams.size > 0 ? `?${nextParams.toString()}` : '',
        },
        {replace: true},
      )
    },
    [activeSearch, location.pathname, navigate],
  )

  const detailCallbacks = useMemo(
    () => ({
      onClose: closeDetail,
      onRelicVariantChange: handleRelicVariantChange,
      onSelectAwakener: handleModalAwakenerSelect,
      onSelectCovenant: handleModalCovenantSelect,
      onSelectPosse: handleModalPosseSelect,
      onSelectRelic: handleModalRelicSelect,
      onSelectWheel: handleModalWheelSelect,
      onTabChange: handleDetailTabChange,
    }),
    [
      closeDetail,
      handleDetailTabChange,
      handleModalAwakenerSelect,
      handleModalCovenantSelect,
      handleModalPosseSelect,
      handleModalRelicSelect,
      handleModalWheelSelect,
      handleRelicVariantChange,
    ],
  )

  const BrowseComponent = entityBrowseComponents[browseController.activeEntity]
  const renderDetailModalHost = useCallback(
    (resultSet: DatabaseDetailResultSet) => (
      <DbDetailModalHost
        awakeners={databaseAwakeners}
        callbacks={detailCallbacks}
        relics={databaseRelics}
        resultSet={resultSet}
        routeItem={routeDetailItem}
        tabSlug={tabSlug}
        wheels={databaseWheels}
      />
    ),
    [detailCallbacks, routeDetailItem, tabSlug],
  )

  return (
    <DatabaseLayout>
      <BrowseComponent
        controller={browseController}
        renderDetailModalHost={renderDetailModalHost}
      />
    </DatabaseLayout>
  )
}
