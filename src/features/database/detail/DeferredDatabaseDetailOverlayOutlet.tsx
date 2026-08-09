import {lazy, Suspense, useSyncExternalStore} from 'react'

import type {DatabaseDetailOverlaySession} from '@/stores/dbDetailStore'

const LazyDatabaseDetailOverlayOutlet = lazy(() =>
  import('./DbDetailModalHost').then((module) => ({
    default: module.DatabaseDetailOverlayOutlet,
  })),
)

export interface DeferredDatabaseDetailOverlayOutletProps {
  session: DatabaseDetailOverlaySession
}

/** Keeps the detail host, registry, and catalogs out of the closed-page module graph. */
export function DeferredDatabaseDetailOverlayOutlet({
  session,
}: DeferredDatabaseDetailOverlayOutletProps) {
  const isOpen = useSyncExternalStore(session.subscribe, session.isOpen, session.isOpen)

  if (!isOpen) return null

  return (
    <Suspense fallback={null}>
      <LazyDatabaseDetailOverlayOutlet session={session} />
    </Suspense>
  )
}
