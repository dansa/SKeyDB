import {lazy, Suspense, useEffect, useSyncExternalStore} from 'react'

import {dbDetailStore} from '@/stores/dbDetailStore'

import type {DbDetailModalHostProps} from './DbDetailModalHost'

const LazyDbDetailModalHost = lazy(() =>
  import('./DbDetailModalHost').then((module) => ({default: module.DbDetailModalHost})),
)

function hasNonRouteDetailOverlay(): boolean {
  const stackTop = dbDetailStore.getState().stack.at(-1)
  return Boolean(stackTop && stackTop.source !== 'database-route')
}

export function DeferredDbDetailModalHost(props: DbDetailModalHostProps) {
  const hasOverlay = useSyncExternalStore(
    dbDetailStore.subscribe,
    hasNonRouteDetailOverlay,
    hasNonRouteDetailOverlay,
  )

  useEffect(() => {
    dbDetailStore
      .getState()
      .syncFromRoute(
        props.routeItem ? {kind: props.routeItem.kind, id: props.routeItem.item.id} : null,
      )
  }, [props.routeItem])

  useEffect(
    () => () => {
      dbDetailStore.getState().syncFromRoute(null)
    },
    [],
  )

  if (!props.routeItem && !hasOverlay) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <LazyDbDetailModalHost {...props} />
    </Suspense>
  )
}
