import {Suspense, useCallback, useEffect, useMemo} from 'react'

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

import {EntityBrowseLoader} from './browse/entityBrowseLoaders'
import {useEntityBrowseController} from './browse/useEntityBrowseController'
import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseRelics,
  databaseWheels,
} from './data'
import {DatabaseLayout} from './DatabaseLayout'
import {getDatabaseDetailBrowseOrigin} from './detail/database-detail-history'
import type {DatabaseDetailResultSet} from './detail/database-detail-result-navigation'
import {DeferredDbDetailModalHost} from './detail/DeferredDbDetailModalHost'

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
  locationState: unknown
  navigate: NavigateFunction
  slug: string | undefined
}

function useDetailRouteCorrection({
  activeSearch,
  browsePath,
  canonicalPath,
  hasSelectedDetail,
  locationPathname,
  locationState,
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
        {replace: true, state: locationState},
      )
    }
  }, [activeSearch, browsePath, hasSelectedDetail, locationState, navigate, slug])

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
      {replace: true, state: locationState},
    )
  }, [
    activeSearch,
    canonicalPath,
    hasSelectedDetail,
    locationPathname,
    locationState,
    navigate,
    slug,
  ])
}

interface DatabasePageProps {
  routeEntity?: DatabaseEntityId
}

export function DatabasePage({routeEntity}: DatabasePageProps = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState: unknown = location.state
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
  const currentRouteEntity = routeEntity ?? getActiveDatabaseEntity(location.pathname)
  const browseOrigin = getDatabaseDetailBrowseOrigin(locationState)
  const activeEntity = browseOrigin?.entity ?? currentRouteEntity
  const isDetailOpen = Boolean(
    selectedAwakener ?? selectedWheel ?? selectedPosse ?? selectedCovenant ?? selectedRelic,
  )
  const browseController = useEntityBrowseController({
    activeEntity,
    browseOrigin,
    isDetailOpen,
    locationPathname: location.pathname,
    locationSearch: location.search,
    locationState,
    navigate,
    routeEntity: currentRouteEntity,
  })
  const activeSearch = browseController.detailSearch
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
    locationState,
    navigate,
    slug: awakenerSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseWheelBrowsePath(),
    canonicalPath: canonicalWheelPath,
    hasSelectedDetail: Boolean(selectedWheel),
    locationPathname: location.pathname,
    locationState,
    navigate,
    slug: wheelSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabasePosseBrowsePath(),
    canonicalPath: canonicalPossePath,
    hasSelectedDetail: Boolean(selectedPosse),
    locationPathname: location.pathname,
    locationState,
    navigate,
    slug: posseSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseCovenantBrowsePath(),
    canonicalPath: canonicalCovenantPath,
    hasSelectedDetail: Boolean(selectedCovenant),
    locationPathname: location.pathname,
    locationState,
    navigate,
    slug: covenantSlug,
  })

  useDetailRouteCorrection({
    activeSearch,
    browsePath: buildDatabaseRelicBrowsePath(),
    canonicalPath: canonicalRelicPath,
    hasSelectedDetail: Boolean(selectedRelic),
    locationPathname: location.pathname,
    locationState,
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
      void navigate(
        {
          pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
          search: activeSearch,
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate, selectedAwakener],
  )

  const handleModalAwakenerSelect = useCallback(
    (
      nextAwakener: Pick<Awakener, 'id' | 'name'>,
      nextTab: DatabaseAwakenerTab = DEFAULT_DATABASE_AWAKENER_TAB,
    ) => {
      void navigate(
        {
          pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
          search: sanitizeDatabaseEntitySearch('awakeners', activeSearch),
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate],
  )

  const handleModalWheelSelect = useCallback(
    (nextWheel: Pick<Wheel, 'id' | 'name'>) => {
      void navigate(
        {
          pathname: buildDatabaseWheelPath(nextWheel),
          search: sanitizeDatabaseEntitySearch('wheels', activeSearch),
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate],
  )

  const handleModalCovenantSelect = useCallback(
    (nextCovenant: Pick<Covenant, 'id' | 'name'>) => {
      void navigate(
        {
          pathname: buildDatabaseCovenantPath(nextCovenant),
          search: sanitizeDatabaseEntitySearch('covenants', activeSearch),
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate],
  )

  const handleModalPosseSelect = useCallback(
    (nextPosse: {id: string; name: string}) => {
      void navigate(
        {
          pathname: buildDatabasePossePath(nextPosse),
          search: sanitizeDatabaseEntitySearch('posses', activeSearch),
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate],
  )

  const handleModalRelicSelect = useCallback(
    (nextRelic: Pick<Relic, 'id' | 'name'>) => {
      void navigate(
        {
          pathname: buildDatabaseRelicPath(nextRelic),
          search: sanitizeDatabaseEntitySearch('relics', activeSearch),
        },
        {replace: true, state: locationState},
      )
    },
    [activeSearch, locationState, navigate],
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
        {replace: true, state: locationState},
      )
    },
    [activeSearch, location.pathname, locationState, navigate],
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

  const renderDetailModalHost = useCallback(
    (resultSet: DatabaseDetailResultSet) => (
      <DeferredDbDetailModalHost
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
      <Suspense fallback={null}>
        <EntityBrowseLoader
          controller={browseController}
          entity={browseController.activeEntity}
          renderDetailModalHost={renderDetailModalHost}
        />
      </Suspense>
    </DatabaseLayout>
  )
}
