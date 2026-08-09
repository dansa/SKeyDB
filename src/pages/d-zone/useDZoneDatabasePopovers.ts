import {useCallback, type MouseEvent} from 'react'

import type {DzoneResolvedMonster} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {useDatabasePopoverSurface} from '@/features/database/popover'

import {buildDzoneMonsterPopoverEntry, loadDzoneRelicPopoverEntry} from './d-zone-popover-entries'
import type {DZoneRelicPreview} from './d-zone-view-model'

export function useDZoneDatabasePopovers() {
  const {openRootInfo} = useDatabasePopoverSurface()

  const openMonsterPopover = useCallback(
    (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => {
      const thumbnailSrc = getDzoneMonsterPreviewAsset(monster.assetName)
      openRootInfo(buildDzoneMonsterPopoverEntry({monster, thumbnailSrc}), event)
    },
    [openRootInfo],
  )

  const openRelicPopover = useCallback(
    async (relic: DZoneRelicPreview, event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      const anchorElement = event.currentTarget
      const entry = await loadDzoneRelicPopoverEntry({
        relicId: relic.id,
        variantId: relic.variantId,
        thumbnailSrc: relic.iconSrc,
      })

      if (!entry || !anchorElement.isConnected) {
        return
      }

      openRootInfo(entry, {
        currentTarget: anchorElement,
        stopPropagation: () => undefined,
      })
    },
    [openRootInfo],
  )

  return {
    openMonsterPopover,
    openRelicPopover,
  }
}
