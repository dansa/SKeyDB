import {useDraggable} from '@dnd-kit/core'

import {CompactArtTile} from '@/components/ui/CompactArtTile'
import {getMainstatByKey, getMainstatIcon, type WheelMainstatKey} from '@/domain/mainstats'

import {PICKER_STATUS_CLASS, PICKER_UNOWNED_CLASS} from './picker-status-labels'
import type {DragData} from './types'

interface PickerWheelTileProps {
  wheelId?: string
  wheelName?: string
  wheelAsset?: string
  blockedText?: string | null
  isBlocked?: boolean
  isInUse?: boolean
  isOwned?: boolean
  isNotSet?: boolean
  recommendationLabel?: string
  recommendedMainstatKey?: WheelMainstatKey
  onClick: () => void
}

function getWheelTileClassName(isBlocked: boolean, isSoftDimmed: boolean): string {
  if (isBlocked) {
    return 'border-slate-500/45 bg-slate-900/45 opacity-55'
  }
  if (isSoftDimmed) {
    return 'border-slate-500/45 bg-slate-900/45 opacity-55 hover:border-amber-200/45'
  }
  return 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
}

function getWheelTopLabel(
  blockedText: string | null,
  isNotSet: boolean,
  isOwned: boolean,
): {text: string; className: string} | null {
  if (blockedText) {
    return {
      text: blockedText,
      className: PICKER_STATUS_CLASS,
    }
  }

  if (!isNotSet && !isOwned) {
    return {
      text: 'Unowned',
      className: PICKER_UNOWNED_CLASS,
    }
  }

  return null
}

function getWheelDisplayName(
  isNotSet: boolean,
  wheelName?: string,
  wheelId?: string,
): string | undefined {
  return isNotSet ? 'Not Set' : (wheelName ?? wheelId)
}

function getWheelDragData(draggableEnabled: boolean, wheelId?: string): DragData | undefined {
  if (!draggableEnabled || !wheelId) {
    return undefined
  }

  return {kind: 'picker-wheel', wheelId}
}

function renderWheelPreview(
  wheelAsset: string | undefined,
  wheelDisplayName: string,
  isOwned: boolean,
  isNotSet: boolean,
  isDimmed: boolean,
) {
  if (wheelAsset) {
    return (
      <img
        alt={`${wheelDisplayName} wheel`}
        className={`builder-picker-wheel-image h-full w-full object-cover ${!isOwned && !isNotSet ? 'builder-picker-art-unowned' : ''} ${isDimmed ? 'builder-picker-art-dimmed' : ''}`}
        draggable={false}
        src={wheelAsset}
      />
    )
  }

  return (
    <span className='relative block h-full w-full'>
      <span className='sigil-placeholder sigil-placeholder-wheel sigil-placeholder-no-plus sigil-placeholder-remove' />
      <span className='sigil-remove-x' />
    </span>
  )
}

export function PickerWheelTile({
  wheelId,
  wheelName,
  wheelAsset,
  blockedText = null,
  isBlocked = false,
  isInUse = false,
  isOwned = true,
  isNotSet = false,
  recommendationLabel,
  recommendedMainstatKey,
  onClick,
}: PickerWheelTileProps) {
  const isDimmed = isBlocked || isInUse || (!isOwned && !isNotSet)
  const isSoftDimmed = !isBlocked && (isInUse || (!isOwned && !isNotSet))
  const draggableWheelId = !isNotSet && wheelId ? wheelId : undefined
  const wheelDisplayName = getWheelDisplayName(isNotSet, wheelName, wheelId) ?? 'Wheel'
  const topLabel = getWheelTopLabel(blockedText, isNotSet, isOwned)
  const buttonStateClassName = getWheelTileClassName(isBlocked, isSoftDimmed)
  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: draggableWheelId ? `picker-wheel:${draggableWheelId}` : `picker-wheel:not-set`,
    data: getWheelDragData(Boolean(draggableWheelId), draggableWheelId),
    disabled: !draggableWheelId,
  })
  const dragAttributes = {...attributes} as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <button
      aria-disabled={isBlocked ? 'true' : undefined}
      className={`builder-picker-tile border p-1 text-left transition-colors ${buttonStateClassName} ${
        isDragging ? 'scale-[0.98] opacity-60' : ''
      }`}
      onClick={onClick}
      ref={setNodeRef}
      type='button'
      {...(draggableWheelId ? dragAttributes : {})}
      {...(draggableWheelId ? listeners : {})}
    >
      <CompactArtTile
        chips={
          !isNotSet && (recommendationLabel || recommendedMainstatKey) ? (
            <>
              {recommendationLabel ? (
                <span className='builder-picker-recommendation-chip'>{recommendationLabel}</span>
              ) : null}
              {recommendedMainstatKey && !recommendationLabel ? (
                <RecommendedMainstatChip mainstatKey={recommendedMainstatKey} />
              ) : null}
            </>
          ) : undefined
        }
        name={wheelDisplayName}
        nameClassName='truncate'
        nameTitle={wheelDisplayName}
        preview={renderWheelPreview(wheelAsset, wheelDisplayName, isOwned, isNotSet, isDimmed)}
        previewClassName='aspect-[75/113] border border-slate-400/35 bg-slate-900/70'
        statusBar={
          topLabel ? <span className={topLabel.className}>{topLabel.text}</span> : undefined
        }
      />
    </button>
  )
}

function RecommendedMainstatChip({mainstatKey}: {mainstatKey: WheelMainstatKey}) {
  const icon = getMainstatIcon(mainstatKey)
  const label = getMainstatByKey(mainstatKey)?.label ?? mainstatKey
  if (!icon) {
    return null
  }

  return (
    <span
      aria-label={`Recommended mainstat ${label}`}
      className='builder-picker-recommendation-chip builder-picker-recommendation-chip-icon'
      title={`Recommended mainstat ${label}`}
    >
      <img alt={`Recommended mainstat ${label}`} className='h-3 w-3 object-contain' src={icon} />
    </span>
  )
}
