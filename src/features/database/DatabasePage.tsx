import {useEffect} from 'react'

import {useLocation, useNavigate, useParams, type NavigateFunction} from 'react-router-dom'

import {resolvePublicRoute} from '@/data-access/public-data/routeResolver'
import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantBrowsePath,
  buildDatabaseCovenantPath,
  buildDatabasePosseBrowsePath,
  buildDatabasePossePath,
  buildDatabaseWheelBrowsePath,
  buildDatabaseWheelPath,
  findAwakenerByDatabaseSlug,
  findCovenantByDatabaseSlug,
  findPosseByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {Wheel} from '@/domain/wheels'

import {renderEntityBrowse} from './browse/entityBrowseRegistry'
import {useEntityBrowseController} from './browse/useEntityBrowseController'
import {databaseAwakeners, databaseCovenants, databasePosses, databaseWheels} from './data'
import {DatabaseLayout} from './DatabaseLayout'
import {DbDetailModalHost} from './detail/DbDetailModalHost'

function getActiveDatabaseEntity(pathname: string): DatabaseEntityId {
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

  return tab === 'overview' ? basePath : `${basePath}/${tab}`
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
  const {awakenerSlug, covenantSlug, posseSlug, tabSlug, wheelSlug} = useParams()
  const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)
  const selectedWheel = findWheelByDatabaseSlug(databaseWheels, wheelSlug)
  const selectedPosse = findPosseByDatabaseSlug(databasePosses, posseSlug)
  const selectedCovenant = findCovenantByDatabaseSlug(databaseCovenants, covenantSlug)
  const selectedTab = resolveDatabaseAwakenerTab(tabSlug) ?? 'overview'
  const activeEntity = routeEntity ?? getActiveDatabaseEntity(location.pathname)
  const browseController = useEntityBrowseController({
    activeEntity,
    isDetailOpen: Boolean(selectedAwakener ?? selectedWheel ?? selectedPosse ?? selectedCovenant),
    locationPathname: location.pathname,
    locationSearch: location.search,
    navigate,
  })
  const activeSearch = browseController.activeSearch
  const canonicalAwakenerPath =
    awakenerSlug && selectedAwakener && !tabSlug
      ? buildCanonicalAwakenerRoutePath(selectedAwakener, awakenerSlug, selectedTab)
      : null
  const canonicalWheelPath =
    wheelSlug && selectedWheel ? buildDatabaseWheelPath(selectedWheel) : null
  const canonicalPossePath =
    posseSlug && selectedPosse ? buildDatabasePossePath(selectedPosse) : null
  const canonicalCovenantPath =
    covenantSlug && selectedCovenant ? buildDatabaseCovenantPath(selectedCovenant) : null

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

  const closeDetail = browseController.closeDetail
  const routeDetailItem = selectedAwakener
    ? ({kind: 'awakener', item: selectedAwakener, activeTab: selectedTab} as const)
    : selectedWheel
      ? ({kind: 'wheel', item: selectedWheel} as const)
      : selectedPosse
        ? ({kind: 'posse', item: selectedPosse} as const)
        : selectedCovenant
          ? ({kind: 'covenant', item: selectedCovenant} as const)
          : null

  function handleDetailTabChange(nextTab: DatabaseAwakenerTab) {
    if (!selectedAwakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
      search: activeSearch,
    })
  }

  function handleModalAwakenerSelect(
    nextAwakener: Pick<Awakener, 'id' | 'name'>,
    nextTab: DatabaseAwakenerTab = 'overview',
  ) {
    void navigate({
      pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
      search: sanitizeDatabaseEntitySearch('awakeners', activeSearch),
    })
  }

  function handleModalWheelSelect(nextWheel: Pick<Wheel, 'id' | 'name'>) {
    void navigate({
      pathname: buildDatabaseWheelPath(nextWheel),
      search: sanitizeDatabaseEntitySearch('wheels', activeSearch),
    })
  }

  function handleModalCovenantSelect(nextCovenant: Pick<Covenant, 'id' | 'name'>) {
    void navigate({
      pathname: buildDatabaseCovenantPath(nextCovenant),
      search: sanitizeDatabaseEntitySearch('covenants', activeSearch),
    })
  }

  return (
    <DatabaseLayout>
      {renderEntityBrowse(browseController)}

      <DbDetailModalHost
        awakeners={databaseAwakeners}
        callbacks={{
          onClose: closeDetail,
          onSelectAwakener: handleModalAwakenerSelect,
          onSelectCovenant: handleModalCovenantSelect,
          onSelectWheel: handleModalWheelSelect,
          onTabChange: handleDetailTabChange,
        }}
        routeItem={routeDetailItem}
        tabSlug={tabSlug}
        wheels={databaseWheels}
      />
    </DatabaseLayout>
  )
}
