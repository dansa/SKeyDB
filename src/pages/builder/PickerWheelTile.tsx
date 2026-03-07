import {useDraggable} from '@dnd-kit/core'

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
      className:
        'pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90',
    }
  }

  if (!isNotSet && !isOwned) {
    return {
      text: 'Unowned',
      className:
        'pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95',
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
      className={`border p-1 text-left transition-colors ${buttonStateClassName} ${
        isDragging ? 'scale-[0.98] opacity-60' : ''
      }`}
      onClick={onClick}
      ref={setNodeRef}
      type='button'
      {...(draggableWheelId ? dragAttributes : {})}
      {...(draggableWheelId ? listeners : {})}
    >
      <div className='relative aspect-[75/113] overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {renderWheelPreview(wheelAsset, wheelDisplayName, isOwned, isNotSet, isDimmed)}
        {topLabel ? <span className={topLabel.className}>{topLabel.text}</span> : null}
      </div>
      <p className='mt-1 truncate text-[11px] text-slate-200'>{wheelDisplayName}</p>
    </button>
  )
}
