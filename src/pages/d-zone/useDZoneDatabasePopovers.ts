import {useCallback, useMemo, type MouseEvent} from 'react'

import type {DzoneResolvedMonster} from '@/domain/dzone'
import {getDzoneMonsterPreviewAsset} from '@/domain/dzone-assets'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {
  buildDzoneMonsterPopoverEntry,
  loadDzoneRelicPopoverEntry,
} from '@/features/database/internal/dzone-popover-entries'
import {useDatabaseDetailPreferences} from '@/features/database/internal/useDatabaseDetailPreferences'
import {useDatabasePopoverController} from '@/features/database/internal/useDatabasePopoverController'

import type {DZoneRelicPreview} from './d-zone-view-model'

export function useDZoneDatabasePopovers() {
  const referenceLayer = useMemo(() => buildGlobalDatabaseReferenceLayer(), [])
  const popoverController = useDatabasePopoverController({
    referenceLayer,
    stats: null,
  })
  const {preferences} = useDatabaseDetailPreferences()
  const openRootInfo = popoverController.contextValue.openRootInfo

  const openMonsterPopover = useCallback(
    (monster: DzoneResolvedMonster, event: MouseEvent<HTMLButtonElement>) => {
      const thumbnailSrc = getDzoneMonsterPreviewAsset(monster.assetName)
      openRootInfo?.(buildDzoneMonsterPopoverEntry({monster, thumbnailSrc}), event)
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

      openRootInfo?.(entry, {
        currentTarget: anchorElement,
        stopPropagation: () => undefined,
      })
    },
    [openRootInfo],
  )

  return {
    closeOnOutsideClick: preferences.shared.clickOutsideClosesPopovers,
    contextValue: popoverController.contextValue,
    openMonsterPopover,
    openRelicPopover,
    popoverRootProps: popoverController.popoverRootProps,
  }
}
