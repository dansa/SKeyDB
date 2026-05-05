/* eslint-disable react-refresh/only-export-components */
import {lazy} from 'react'

import {Navigate, Route, useLocation, useParams} from 'react-router-dom'

import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'

const DatabasePage = lazy(() =>
  import('./DatabasePage').then((module) => ({default: module.DatabasePage})),
)

function LegacyAwakenerRouteRedirect() {
  const location = useLocation()
  const {awakenerSlug, tabSlug} = useParams()
  const slug = awakenerSlug ?? ''
  const tabPath = tabSlug ? `/${tabSlug}` : ''
  return (
    <Navigate
      replace
      to={{
        pathname: `/database/awakeners/${slug}${tabPath}`,
        search: sanitizeDatabaseEntitySearch('awakeners', location.search),
      }}
    />
  )
}

function DatabaseRoutePage({entity}: {entity: DatabaseEntityId}) {
  return <DatabasePage routeEntity={entity} />
}

export const DatabaseRouteElements = (
  <>
    <Route element={<DatabaseRoutePage entity='awakeners' />} path='/database' />
    <Route element={<DatabaseRoutePage entity='wheels' />} path='/database/wheels' />
    <Route element={<DatabaseRoutePage entity='wheels' />} path='/database/wheels/:wheelSlug' />
    <Route element={<DatabaseRoutePage entity='posses' />} path='/database/posses' />
    <Route element={<DatabaseRoutePage entity='posses' />} path='/database/posses/:posseSlug' />
    <Route element={<DatabaseRoutePage entity='covenants' />} path='/database/covenants' />
    <Route
      element={<DatabaseRoutePage entity='covenants' />}
      path='/database/covenants/:covenantSlug'
    />
    <Route
      element={<DatabaseRoutePage entity='awakeners' />}
      path='/database/awakeners/:awakenerSlug'
    />
    <Route
      element={<DatabaseRoutePage entity='awakeners' />}
      path='/database/awakeners/:awakenerSlug/:tabSlug'
    />
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug' />
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug/:tabSlug' />
  </>
)
