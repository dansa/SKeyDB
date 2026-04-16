import {type MouseEvent} from 'react'

import type {AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'
import type {DatabaseInfluenceBadge} from '@/domain/awakeners-database-view'

import {getEnlightenSlotLabel, isEnlightenSlotActive} from './awakener-enlighten-badges'
import {useDatabasePopoverControllerContext} from './database-popover-context'

interface AwakenerEnlightenInfluenceBadgesProps {
  influenceBadges: readonly DatabaseInfluenceBadge[]
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  align?: 'start' | 'end'
  openMode?: 'root' | 'nested'
  onOpenReferenceName?: (name: string) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
}

export function AwakenerEnlightenInfluenceBadges({
  influenceBadges,
  selectedEnlightenSlot,
  align = 'start',
  openMode = 'root',
  onOpenReferenceName,
  onToggleEnlightenSlot,
}: AwakenerEnlightenInfluenceBadgesProps) {
  const popoverController = useDatabasePopoverControllerContext()

  if (influenceBadges.length === 0) {
    return null
  }

  function handleBadgeContextMenu(
    event: MouseEvent<HTMLElement>,
    slot: AwakenerEnlightenRecord['slot'] | undefined,
  ) {
    if (!onToggleEnlightenSlot || !slot) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onToggleEnlightenSlot(slot)
  }

  function getBadgeTitle(badge: DatabaseInfluenceBadge, active: boolean): string {
    if (badge.kind !== 'enlighten' || !badge.slot) {
      return `Left-click: open ${badge.label} details`
    }

    const label = getEnlightenSlotLabel(badge.slot)
    if (!onToggleEnlightenSlot) {
      return `Left-click: open ${label} details`
    }

    return active
      ? `Left-click: open ${label} details\nRight-click: switch ${label} off`
      : `Left-click: open ${label} details\nRight-click: activate ${label}`
  }

  function getBadgeClass(badge: DatabaseInfluenceBadge, active: boolean): string {
    if (badge.kind !== 'enlighten') {
      return 'border border-amber-200/60 bg-amber-200/10 px-1.5 py-0.5 text-[9px] tracking-wide uppercase text-amber-100'
    }

    return `border px-1.5 py-0.5 text-[9px] tracking-wide uppercase ${
      active
        ? 'border-amber-200/60 bg-amber-200/10 text-amber-100 hover:border-amber-50/80 hover:bg-amber-200/20 hover:text-amber-50'
        : 'border-slate-600/35 bg-slate-950/50 text-slate-500 hover:border-amber-100/60 hover:text-amber-50'
    }`
  }

  function getOpenBadgeReference(
    referenceName: string | undefined,
  ): ((event: MouseEvent<HTMLElement>) => void) | null {
    if (!referenceName) {
      return null
    }

    if (openMode === 'nested') {
      if (onOpenReferenceName) {
        return () => {
          onOpenReferenceName(referenceName)
        }
      }

      if (!popoverController) {
        return null
      }

      return () => {
        popoverController.openNestedReferenceByName(referenceName)
      }
    }

    if (!popoverController) {
      return null
    }

    return (event) => {
      popoverController.openRootReferenceByName(referenceName, event)
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${align === 'end' ? 'justify-end' : ''}`}>
      {influenceBadges.map((badge) => {
        const active =
          badge.kind === 'enlighten' && badge.slot
            ? isEnlightenSlotActive(badge.slot, selectedEnlightenSlot)
            : false
        const badgeClass = getBadgeClass(badge, active)
        const badgeTitle = getBadgeTitle(badge, active)
        const openBadgeReference = getOpenBadgeReference(badge.referenceName)
        const badgeKey = `${badge.kind}:${badge.id}`
        const commonProps = {
          onContextMenu: (event: MouseEvent<HTMLElement>) => {
            handleBadgeContextMenu(event, badge.slot)
          },
          title: badgeTitle,
        }

        if (!openBadgeReference) {
          return (
            <span key={badgeKey} {...commonProps} className={badgeClass}>
              {badge.label}
            </span>
          )
        }

        return (
          <button
            key={badgeKey}
            {...commonProps}
            className={`${badgeClass} cursor-pointer transition-colors hover:border-amber-50/80 hover:bg-amber-200/20 hover:text-amber-50 focus-visible:ring-1 focus-visible:ring-amber-100/80 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 focus-visible:outline-none`}
            onClick={openBadgeReference}
            type='button'
          >
            {badge.label}
          </button>
        )
      })}
    </div>
  )
}
