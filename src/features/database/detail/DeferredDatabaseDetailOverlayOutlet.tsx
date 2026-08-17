import {lazy, Suspense, useSyncExternalStore} from 'react'

import type {DatabaseDetailOverlaySession, DbDetailEntityRef} from '@/stores/dbDetailStore'

import {preloadDatabaseDetailOverlayOutlet} from './databaseDetailOverlayLoader'
import {DbDetailModalFrame} from './DbDetailModalFrame'

const LazyDatabaseDetailOverlayOutlet = lazy(preloadDatabaseDetailOverlayOutlet)

export interface DeferredDatabaseDetailOverlayOutletProps {
  getLoadingAriaLabel?: (ref: DbDetailEntityRef) => string | undefined
  session: DatabaseDetailOverlaySession
}

/** Keeps the detail host, registry, and catalogs out of the closed-page module graph. */
export function DeferredDatabaseDetailOverlayOutlet({
  getLoadingAriaLabel,
  session,
}: DeferredDatabaseDetailOverlayOutletProps) {
  const activeRef = useSyncExternalStore(session.subscribe, session.top, session.top)

  if (!activeRef) return null

  return (
    <Suspense
      fallback={
        <DbDetailModalFrame
          ariaLabel={getLoadingAriaLabel?.(activeRef) ?? 'Loading database details'}
          maxWidth='standard'
          onCancel={(event) => {
            event.preventDefault()
            event.stopPropagation()
            session.close()
          }}
          onOverlayClick={(event) => {
            if (event.target === event.currentTarget) {
              session.close()
            }
          }}
        >
          <div className='w-full max-w-5xl border border-amber-200/55 bg-slate-950/[.985] px-6 py-12 text-center shadow-[0_24px_70px_rgba(2,6,23,0.8)]'>
            <output className='text-sm text-slate-400'>Loading details…</output>
          </div>
        </DbDetailModalFrame>
      }
    >
      <LazyDatabaseDetailOverlayOutlet session={session} />
    </Suspense>
  )
}
