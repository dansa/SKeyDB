import {lazy, Suspense} from 'react'

import type {DbDetailModalHostProps} from '@/features/database/detail/DbDetailModalHost'

const LazyDatabaseRouteDetailHost = lazy(() =>
  import('./DatabaseRouteDetailHost').then((module) => ({
    default: module.DatabaseRouteDetailHost,
  })),
)

type DeferredDatabaseRouteDetailHostProps = Omit<
  DbDetailModalHostProps,
  'awakeners' | 'relics' | 'wheels'
>

export function DeferredDatabaseRouteDetailHost(props: DeferredDatabaseRouteDetailHostProps) {
  if (!props.routeItem) return null

  return (
    <Suspense fallback={null}>
      <LazyDatabaseRouteDetailHost {...props} />
    </Suspense>
  )
}
