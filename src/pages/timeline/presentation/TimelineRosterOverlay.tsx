import {useState} from 'react'

import {useNavigate} from 'react-router'

import {DeferredDatabaseDetailOverlayOutlet} from '@/features/database/detail/DeferredDatabaseDetailOverlayOutlet'
import {createDatabaseDetailOverlaySession, type DbDetailEntityRef} from '@/stores/dbDetailStore'

export function TimelineRosterOverlay({entry}: {entry: DbDetailEntityRef}) {
  const navigate = useNavigate()
  const [session] = useState(() => {
    let closing = false
    return createDatabaseDetailOverlaySession({
      initialRef: entry,
      onCloseRoot: () => {
        if (closing) return
        closing = true
        void navigate(-1)
      },
    })
  })
  return <DeferredDatabaseDetailOverlayOutlet session={session} />
}
