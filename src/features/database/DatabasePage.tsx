import {Suspense, useCallback, useEffect, useMemo} from 'react'

import {useLocation, useNavigate} from 'react-router'

import './database.css'

import {resolveDatabaseDetailDefaultAwakenerTab} from '@/domain/database-detail-preferences'
import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'
import {getBrowserLocalStorage} from '@/domain/storage'

import {EntityBrowseLoader} from './browse/entityBrowseLoaders'
import {useEntityBrowseController} from './browse/useEntityBrowseController'
import {DatabaseLayout} from './DatabaseLayout'
import {getDatabaseDetailBrowseOrigin} from './detail/database-detail-history'
import type {DatabaseDetailResultSet} from './detail/database-detail-result-navigation'
import {parseDatabaseRoutePath} from './runtime/databaseRouteResolution'
import {DeferredDatabaseRouteDetailHost} from './runtime/DeferredDatabaseRouteDetailHost'
import {useDatabaseRouteNavigation} from './runtime/useDatabaseRouteNavigation'
import {useDatabaseRouteResolution} from './runtime/useDatabaseRouteResolution'

export function DatabasePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationState: unknown = location.state
  const parsedRoute = useMemo(() => parseDatabaseRoutePath(location.pathname), [location.pathname])
  const detailPreferenceStorage = useMemo(() => getBrowserLocalStorage(), [])
  const defaultAwakenerTab = resolveDatabaseDetailDefaultAwakenerTab(
    undefined,
    detailPreferenceStorage,
  )
  const routeResolution = useDatabaseRouteResolution({
    defaultAwakenerTab,
    route: parsedRoute,
    search: location.search,
  })
  const routeDetailItem =
    routeResolution.status === 'resolved' ? routeResolution.resolution.routeItem : null
  const browseOrigin = getDatabaseDetailBrowseOrigin(locationState)
  const activeEntity = browseOrigin?.entity ?? parsedRoute.entity
  const browseController = useEntityBrowseController({
    activeEntity,
    browseOrigin,
    isDetailOpen: parsedRoute.kind === 'detail',
    locationPathname: location.pathname,
    locationSearch: location.search,
    locationState,
    navigate,
    routeEntity: parsedRoute.entity,
  })
  const activeSearch = browseController.detailSearch

  useEffect(() => {
    const browsePath = buildDatabaseEntityBrowsePath(parsedRoute.entity)
    if (parsedRoute.kind === 'invalid') {
      void navigate(
        {pathname: browsePath, search: activeSearch},
        {replace: true, state: locationState},
      )
      return
    }
    if (parsedRoute.kind !== 'detail') return
    if (routeResolution.status === 'error') {
      void navigate(
        {pathname: browsePath, search: activeSearch},
        {replace: true, state: locationState},
      )
      return
    }
    if (routeResolution.status !== 'resolved') return

    const {canonicalPath, routeItem} = routeResolution.resolution
    const pathname = routeItem ? canonicalPath : browsePath
    if (location.pathname === pathname) return
    void navigate({pathname, search: activeSearch}, {replace: true, state: locationState})
  }, [activeSearch, location.pathname, locationState, navigate, parsedRoute, routeResolution])

  const detailCallbacks = useDatabaseRouteNavigation({
    activeSearch,
    defaultAwakenerTab,
    locationState,
    navigate,
    onClose: browseController.closeDetail,
    routeItem: routeDetailItem,
  })
  const tabSlug = parsedRoute.kind === 'detail' ? parsedRoute.suffixSegments[0] : undefined
  const renderDetailModalHost = useCallback(
    (resultSet: DatabaseDetailResultSet) => (
      <DeferredDatabaseRouteDetailHost
        navigationPort={detailCallbacks}
        resultSet={resultSet}
        routeItem={routeDetailItem}
        tabSlug={tabSlug}
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
