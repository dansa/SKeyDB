import {useDraggable} from '@dnd-kit/core'

import type {DragData} from './types'

interface PickerCovenantTileProps {
  covenantId?: string
  covenantName?: string
  covenantAsset?: string
  isNotSet?: boolean
  onClick: () => void
}

function getCovenantDisplayName(
  isNotSet: boolean,
  covenantName?: string,
  covenantId?: string,
): string | undefined {
  return isNotSet ? 'Not Set' : (covenantName ?? covenantId)
}

function getCovenantDragData(draggableEnabled: boolean, covenantId?: string): DragData | undefined {
  if (!draggableEnabled || !covenantId) {
    return undefined
  }

  return {kind: 'picker-covenant', covenantId}
}

function renderCovenantPreview(
  covenantAsset: string | undefined,
  isNotSet: boolean,
  altText: string,
) {
  if (covenantAsset) {
    return (
      <img
        alt={altText}
        className='h-full w-full object-cover'
        draggable={false}
        src={covenantAsset}
      />
    )
  }

  if (isNotSet) {
    return (
      <span className='builder-disabled-icon'>
        <span className='builder-disabled-icon__glyph' />
      </span>
    )
  }

  return (
    <span className='relative block h-full w-full'>
      <span className='sigil-placeholder' />
    </span>
  )
}

export function PickerCovenantTile({
  covenantId,
  covenantName,
  covenantAsset,
  isNotSet = false,
  onClick,
}: PickerCovenantTileProps) {
  const draggableCovenantId = !isNotSet && covenantId ? covenantId : undefined
  const covenantDisplayName =
    getCovenantDisplayName(isNotSet, covenantName, covenantId) ?? 'Covenant'
  const altText = `${covenantDisplayName} covenant`
  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: draggableCovenantId ? `picker-covenant:${draggableCovenantId}` : 'picker-covenant:not-set',
    data: getCovenantDragData(Boolean(draggableCovenantId), draggableCovenantId),
    disabled: !draggableCovenantId,
  })
  const dragAttributes = {...attributes} as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <button
      aria-label={isNotSet ? 'Not set covenant' : altText}
      className={`border border-slate-500/45 bg-slate-900/55 p-1 text-left transition-colors hover:border-amber-200/45 ${
        isDragging ? 'scale-[0.98] opacity-60' : ''
      }`}
      onClick={onClick}
      ref={setNodeRef}
      type='button'
      {...(draggableCovenantId ? dragAttributes : {})}
      {...(draggableCovenantId ? listeners : {})}
    >
      <div className='relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70'>
        {renderCovenantPreview(covenantAsset, isNotSet, altText)}
      </div>
      <p className='mt-1 truncate text-[11px] text-slate-200'>{covenantDisplayName}</p>
    </button>
  )
}
