import {useEffect} from 'react'

import {dbDetailStore, type DbDetailOverlaySource} from '@/stores/dbDetailStore'

export function useDbDetailOverlayOwner(source: DbDetailOverlaySource) {
  useEffect(
    () => () => {
      dbDetailStore.getState().closeOverlaySource(source)
    },
    [source],
  )
}
