import {lazy, Suspense} from 'react'

import type {DbDetailModalHostProps} from './DbDetailModalHost'

const LazyDbDetailModalHost = lazy(() =>
  import('./DbDetailModalHost').then((module) => ({default: module.DbDetailModalHost})),
)

export function DeferredDbDetailModalHost(props: DbDetailModalHostProps) {
  if (!props.routeItem) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <LazyDbDetailModalHost {...props} />
    </Suspense>
  )
}
