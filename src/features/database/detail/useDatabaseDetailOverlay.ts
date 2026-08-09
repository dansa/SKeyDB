import {useEffect, useState, useSyncExternalStore} from 'react'

import {
  createDatabaseDetailOverlaySession,
  type DatabaseDetailOverlaySession,
} from '@/stores/dbDetailStore'

export interface DatabaseDetailOverlayController {
  close: DatabaseDetailOverlaySession['close']
  followReference: DatabaseDetailOverlaySession['followReference']
  isOpen: boolean
  open: DatabaseDetailOverlaySession['open']
  session: DatabaseDetailOverlaySession
}

/** Owns an isolated detail-overlay branch for exactly one mounted consumer. */
export function useDatabaseDetailOverlay(): DatabaseDetailOverlayController {
  const [session] = useState(createDatabaseDetailOverlaySession)
  const isOpen = useSyncExternalStore(session.subscribe, session.isOpen, session.isOpen)

  useEffect(
    () => () => {
      session.dispose()
    },
    [session],
  )

  return {
    close: session.close,
    followReference: session.followReference,
    isOpen,
    open: session.open,
    session,
  }
}
