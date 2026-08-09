import {lazy} from 'react'

import {Navigate, Route, useLocation, useParams} from 'react-router'

import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'

const DatabasePage = lazy(() =>
  import('./DatabasePage').then((module) => ({default: module.DatabasePage})),
)

function LegacyAwakenerRouteRedirect() {
  const location = useLocation()
  const {awakenerSlug, tabSlug} = useParams()
  const tabPath = tabSlug ? `/${tabSlug}` : ''
  return (
    <Navigate
      replace
      to={{
        pathname: `/database/awakeners/${awakenerSlug ?? ''}${tabPath}`,
        search: sanitizeDatabaseEntitySearch('awakeners', location.search),
      }}
    />
  )
}

export const DatabaseRouteElements = (
  <>
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug' />
    <Route element={<LegacyAwakenerRouteRedirect />} path='/database/awk/:awakenerSlug/:tabSlug' />
    <Route element={<DatabasePage />} path='/database/*' />
  </>
)
