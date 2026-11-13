import {lazy} from 'react'

import {Navigate, useLocation, useParams} from 'react-router'

import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'

export const DatabasePage = lazy(() =>
  import('./DatabasePage').then((module) => ({default: module.DatabasePage})),
)

export function LegacyAwakenerRouteRedirect() {
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
