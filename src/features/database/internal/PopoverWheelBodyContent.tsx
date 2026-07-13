import {Suspense, type MouseEvent} from 'react'

import {type DraggableAttributes, type DraggableSyntheticListeners} from '@dnd-kit/core'

import type {Wheel} from '@/domain/wheels'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabaseRichTextContent, type DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {scaledFontStyle} from './font-scale'
import {PopoverCloseButton, PopoverPinButton} from './PopoverAtoms'
import {TextWithBreaksFallback} from './PopoverSubComponents'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'
import {WheelDetailArtwork} from './WheelDetailArtwork'

export interface PopoverWheelBodyContentProps {
  wheel: Wheel | null
  entry: KeyedDatabaseReferenceEntry
  isDraggable: boolean
  dragAttributes?: DraggableAttributes
  dragListeners?: DraggableSyntheticListeners
  isPinned: boolean
  onTogglePin?: () => void
  onClose: () => void
  onNavigate?: () => void
  attributeRows: {iconSrc?: string; label: string; value: string}[]
  onMainstatClick: (e: MouseEvent<HTMLButtonElement>) => void
  contentProps: DatabaseRichTextContentProps
  fallbackText: string
}

export function PopoverWheelBodyContent({
  wheel,
  entry,
  isDraggable,
  dragAttributes,
  dragListeners,
  isPinned,
  onTogglePin,
  onClose,
  onNavigate,
  attributeRows,
  onMainstatClick,
  contentProps,
  fallbackText,
}: PopoverWheelBodyContentProps) {
  return (
    <div className='flex min-h-[11.5rem] items-stretch gap-3.5 overflow-hidden rounded-[inherit] leading-relaxed text-slate-300'>
      <div className='relative hidden w-[5.625rem] shrink-0 overflow-hidden rounded-[inherit] bg-slate-900/10 md:block'>
        <div className='absolute inset-0'>
          <WheelDetailArtwork wheel={wheel} variant='popover-cover' />
        </div>
      </div>

      <div className='flex min-w-0 flex-1 flex-col'>
        <div
          className={`flex min-w-0 items-center justify-between gap-4 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} select-none`}
          data-popover-drag-handle={isDraggable ? '' : undefined}
          {...dragAttributes}
          {...dragListeners}
          role='presentation'
        >
          {entry.navigationTarget && onNavigate ? (
            <button
              className={`${DATABASE_ENTRY_TITLE_CLASS} flex min-w-0 items-center gap-1 text-left transition-colors hover:text-amber-100`}
              onClick={() => {
                onClose()
                onNavigate()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              onPointerDown={(e) => {
                e.stopPropagation()
              }}
              style={scaledFontStyle(13)}
              type='button'
            >
              <span className='truncate'>{entry.name}</span>
              <span className='shrink-0 select-none'>↗</span>
            </button>
          ) : (
            <h3 className={`${DATABASE_ENTRY_TITLE_CLASS} truncate`} style={scaledFontStyle(13)}>
              {entry.name}
            </h3>
          )}
          <div className='flex shrink-0 items-center gap-1.5'>
            {onTogglePin && <PopoverPinButton isPinned={isPinned} onTogglePin={onTogglePin} />}
            <PopoverCloseButton onClose={onClose} />
          </div>
        </div>

        {entry.label && (
          <p className='mt-0.5 text-[11px] text-slate-500' style={scaledFontStyle(11)}>
            {entry.label}
          </p>
        )}

        {attributeRows.length > 0 && (
          <button
            className='mt-3 mb-3.5 flex w-full cursor-pointer items-center gap-x-2 border-t border-b border-slate-700/35 px-1 py-2 text-left transition-colors hover:bg-slate-700/15 focus-visible:ring-1 focus-visible:ring-amber-400/20 focus-visible:outline-none'
            onClick={onMainstatClick}
            type='button'
          >
            {attributeRows[0].iconSrc && (
              <img
                alt=''
                className='size-5 shrink-0 object-contain opacity-95'
                draggable={false}
                src={attributeRows[0].iconSrc}
              />
            )}
            <span className='text-[11px] font-medium text-slate-400' style={scaledFontStyle(11)}>
              {attributeRows[0].label}
            </span>
            <span
              className='text-[12px] font-semibold text-amber-100/90'
              style={scaledFontStyle(12)}
            >
              {attributeRows[0].value}
            </span>
          </button>
        )}

        <div className='mt-0.5 leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
          <Suspense fallback={fallbackText ? <TextWithBreaksFallback text={fallbackText} /> : null}>
            <DatabaseRichTextContent {...contentProps} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
