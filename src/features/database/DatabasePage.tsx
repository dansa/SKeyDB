import {useEffect} from 'react'

import {useLocation, useNavigate, useParams} from 'react-router-dom'

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

  useEffect(() => {
    if (awakenerSlug && !selectedAwakener) {
      void navigate(
        {
          pathname: buildDatabaseEntityBrowsePath('awakeners'),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, awakenerSlug, navigate, selectedAwakener])

  useEffect(() => {
    if (!awakenerSlug || !selectedAwakener) {
      return
    }
    const canonicalPath = buildCanonicalAwakenerRoutePath(
      selectedAwakener,
      awakenerSlug,
      selectedTab,
    )
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, awakenerSlug, location.pathname, navigate, selectedAwakener, selectedTab])

  useEffect(() => {
    if (wheelSlug && !selectedWheel) {
      void navigate(
        {
          pathname: buildDatabaseWheelBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, navigate, selectedWheel, wheelSlug])

  useEffect(() => {
    if (!wheelSlug || !selectedWheel) {
      return
    }
    const canonicalPath = buildDatabaseWheelPath(selectedWheel)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, location.pathname, navigate, selectedWheel, wheelSlug])

  useEffect(() => {
    if (posseSlug && !selectedPosse) {
      void navigate(
        {
          pathname: buildDatabasePosseBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, navigate, posseSlug, selectedPosse])

  useEffect(() => {
    if (!posseSlug || !selectedPosse) {
      return
    }
    const canonicalPath = buildDatabasePossePath(selectedPosse)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, location.pathname, navigate, posseSlug, selectedPosse])

  useEffect(() => {
    if (covenantSlug && !selectedCovenant) {
      void navigate(
        {
          pathname: buildDatabaseCovenantBrowsePath(),
          search: activeSearch,
        },
        {replace: true},
      )
    }
  }, [activeSearch, covenantSlug, navigate, selectedCovenant])

  useEffect(() => {
    if (!covenantSlug || !selectedCovenant) {
      return
    }
    const canonicalPath = buildDatabaseCovenantPath(selectedCovenant)
    if (location.pathname === canonicalPath) {
      return
    }
    void navigate(
      {
        pathname: canonicalPath,
        search: activeSearch,
      },
      {replace: true},
    )
  }, [activeSearch, covenantSlug, location.pathname, navigate, selectedCovenant])

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

  function handleModalWheelSelect(nextWheel: Pick<Wheel, 'name'>) {
    void navigate({
      pathname: buildDatabaseWheelPath(nextWheel),
      search: sanitizeDatabaseEntitySearch('wheels', activeSearch),
    })
  }

  function handleModalCovenantSelect(nextCovenant: Pick<Covenant, 'name'>) {
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
