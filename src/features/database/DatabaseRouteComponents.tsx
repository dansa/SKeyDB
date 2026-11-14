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
      state={location.state as unknown}
      to={{
        pathname: `/database/awakeners/${awakenerSlug ?? ''}${tabPath}`,
        hash: location.hash,
        search: sanitizeDatabaseEntitySearch('awakeners', location.search),
      }}
    />
  )
}
