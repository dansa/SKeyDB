import {useEffect, useState} from 'react'

import {loadOverlayIconAsset, peekOverlayIconAsset} from '@/domain/overlay-icon-assets'

export function useOverlayIcon(rawIconId: string | null) {
  const iconId = rawIconId?.startsWith('IconS_Buff_')
    ? rawIconId.replace('IconS_Buff_', 'Battle_Card_Buff_')
    : rawIconId
  const cachedIconUrl = peekOverlayIconAsset(iconId)
  const [loadedIcon, setLoadedIcon] = useState<{iconId: string | null; url?: string}>({
    iconId,
    url: cachedIconUrl,
  })

  useEffect(() => {
    let cancelled = false
    if (!iconId || cachedIconUrl) {
      return
    }

    void loadOverlayIconAsset(iconId).then((nextIconUrl) => {
      if (!cancelled) {
        setLoadedIcon({iconId, url: nextIconUrl})
      }
    })

    return () => {
      cancelled = true
    }
  }, [cachedIconUrl, iconId])

  return loadedIcon.iconId === iconId ? loadedIcon.url : cachedIconUrl
}
