import {useDraggable} from '@dnd-kit/core'
import {FaCircleInfo} from 'react-icons/fa6'

import {CompactArtTile} from '@/ui/cards/CompactArtTile'

import {PICKER_RECOMMENDATION_CLASS} from './picker-status-labels'
import type {DragData} from './types'

interface PickerCovenantTileProps {
  covenantId?: string
  covenantName?: string
  covenantAsset?: string
  isNotSet?: boolean
  recommendationLabel?: string
  onClick: () => void
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

function CovenantPreview({
  covenantAsset,
  isNotSet,
  altText,
}: {
  covenantAsset: string | undefined
  isNotSet: boolean
  altText: string
}) {
  if (covenantAsset) {
    return (
      <img
        alt={altText}
        className='h-full w-full object-cover'
        decoding='async'
        draggable={false}
        fetchPriority='low'
        loading='lazy'
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
    <div className='group relative min-w-0'>
      <div
        className={`builder-picker-tile relative w-full min-w-0 border border-slate-500/45 bg-slate-900/55 p-1 text-left transition-colors hover:border-amber-200/45 ${
          isDragging ? 'scale-[0.98] opacity-60' : ''
        }`}
      >
        <button
          aria-label={isNotSet ? 'Not set covenant' : altText}
          className='absolute inset-0 z-20 cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70'
          onClick={onClick}
          ref={setNodeRef}
          type='button'
          {...(draggableCovenantId ? dragAttributes : {})}
          {...(draggableCovenantId ? listeners : {})}
        />
        <CompactArtTile
          actionPlacement='caption'
          actions={
            !isNotSet ? (
              <button
                aria-label='Open details overlay'
                className='builder-picker-detail-action inline-flex items-center justify-center text-slate-400 hover:text-amber-100 focus-visible:text-amber-100 focus-visible:outline-none'
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  onOpenDetail?.()
                }}
                title={`Open ${covenantDisplayName} details overlay`}
                type='button'
              >
                <FaCircleInfo aria-hidden className='size-3' />
              </button>
            ) : undefined
          }
          chips={
            !isNotSet && recommendationLabel ? (
              <span className={PICKER_RECOMMENDATION_CLASS}>{recommendationLabel}</span>
            ) : undefined
          }
          chipPlacement='overlay-stack'
          name={covenantDisplayName}
          nameClassName='truncate'
          nameTitle={covenantDisplayName}
          preview={
            <CovenantPreview covenantAsset={covenantAsset} isNotSet={isNotSet} altText={altText} />
          }
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
        />
      </div>
    </div>
  )
}
