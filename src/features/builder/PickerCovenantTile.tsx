import {useDraggable} from '@dnd-kit/core'
import {FaArrowUpRightFromSquare, FaCircleInfo} from 'react-icons/fa6'

import {CompactArtTile} from '@/ui/cards/CompactArtTile'

import type {DragData} from './types'

interface PickerCovenantTileProps {
  covenantId?: string
  covenantName?: string
  covenantAsset?: string
  isNotSet?: boolean
  recommendationLabel?: string
  onClick: () => void
  onOpenDatabasePage?: () => void
  onOpenDetail?: () => void
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
  recommendationLabel,
  onClick,
  onOpenDatabasePage,
  onOpenDetail,
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
    <div className='group relative'>
      <button
        aria-label={isNotSet ? 'Not set covenant' : altText}
        className={`builder-picker-tile border border-slate-500/45 bg-slate-900/55 p-1 text-left transition-colors hover:border-amber-200/45 ${
          isDragging ? 'scale-[0.98] opacity-60' : ''
        }`}
        onClick={onClick}
        ref={setNodeRef}
        type='button'
        {...(draggableCovenantId ? dragAttributes : {})}
        {...(draggableCovenantId ? listeners : {})}
      >
        <CompactArtTile
          chips={
            !isNotSet && recommendationLabel ? (
              <span className='builder-picker-recommendation-chip'>{recommendationLabel}</span>
            ) : undefined
          }
          name={covenantDisplayName}
          nameClassName='truncate'
          nameTitle={covenantDisplayName}
          preview={renderCovenantPreview(covenantAsset, isNotSet, altText)}
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
        />
      </button>
      {!isNotSet ? (
        <div className='absolute top-1 right-1 z-30 flex gap-1'>
          <button
            aria-label='Open details overlay'
            className='inline-flex h-6 w-6 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenDetail?.()
            }}
            title={`Open ${covenantDisplayName} details overlay`}
            type='button'
          >
            <FaCircleInfo aria-hidden className='h-3 w-3' />
          </button>
          <button
            aria-label='Open database page'
            className='inline-flex h-6 w-6 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onOpenDatabasePage?.()
            }}
            title={`Open ${covenantDisplayName} database page`}
            type='button'
          >
            <FaArrowUpRightFromSquare aria-hidden className='h-3 w-3' />
          </button>
        </div>
      ) : null}
    </div>
  )
}
