import {useDraggable} from '@dnd-kit/core'
import {FaCircleInfo} from 'react-icons/fa6'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent} from '@/domain/realms'
import {CompactArtTile} from '@/ui/cards/CompactArtTile'

import {PICKER_STATUS_CLASS, PICKER_UNOWNED_CLASS} from './picker-status-labels'
import type {DragData} from './types'

interface PickerAwakenerTileProps {
  awakenerId: string
  awakenerName: string
  realm: string
  isRealmBlocked: boolean
  isInUse: boolean
  isOwned: boolean
  onClick: () => void
  onOpenDetail: () => void
}

function CompactStatusChip({
  className,
  fullText,
  visibleText = fullText,
}: {
  className: string
  fullText: string
  visibleText?: string
}) {
  return (
    <span className={className} title={fullText}>
      {visibleText !== fullText ? <span className='sr-only'>{fullText}</span> : null}
      <span aria-hidden={visibleText !== fullText}>{visibleText}</span>
    </span>
  )
}

function renderAwakenerStatusSignals(isRealmBlocked: boolean, isInUse: boolean, isOwned: boolean) {
  if (isInUse && isRealmBlocked) {
    return (
      <CompactStatusChip
        className={PICKER_STATUS_CLASS}
        fullText='Already Used / Wrong Realm'
        visibleText='Blocked'
      />
    )
  }

  if (isInUse) {
    return (
      <CompactStatusChip
        className={PICKER_STATUS_CLASS}
        fullText='Already Used'
        visibleText='Used'
      />
    )
  }

  if (isRealmBlocked) {
    return (
      <CompactStatusChip
        className={PICKER_STATUS_CLASS}
        fullText='Wrong Realm'
        visibleText='Realm'
      />
    )
  }

  if (!isOwned) {
    return <CompactStatusChip className={PICKER_UNOWNED_CLASS} fullText='Unowned' />
  }

  return undefined
}

export function PickerAwakenerTile({
  awakenerName,
  awakenerId,
  realm,
  isRealmBlocked,
  isInUse,
  isOwned,
  onClick,
  onOpenDetail,
}: PickerAwakenerTileProps) {
  const displayName = formatAwakenerNameForUi(awakenerName)
  const portraitAsset = getAwakenerPortraitAsset(awakenerName)
  const isDimmed = isRealmBlocked || isInUse
  const realmAccent = getRealmAccent(realm)
  const statusSignals = renderAwakenerStatusSignals(isRealmBlocked, isInUse, isOwned)
  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: `picker:${awakenerId}`,
    data: {kind: 'picker-awakener', awakenerId, awakenerName} satisfies DragData,
  })
  const dragAttributes = {...attributes} as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <div className='group relative min-w-0'>
      <div
        className={`builder-picker-tile relative w-full min-w-0 border border-slate-500/45 bg-slate-900/55 p-1 text-left transition-colors hover:border-amber-200/45 ${
          isDragging ? 'scale-[0.98] opacity-60' : ''
        } ${isDimmed ? 'opacity-55' : ''}`}
      >
        <button
          aria-label={`${displayName} portrait`}
          className='absolute inset-0 z-20 cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-200/70'
          data-realm-blocked={isRealmBlocked ? 'true' : 'false'}
          data-in-use={isInUse ? 'true' : 'false'}
          onClick={onClick}
          ref={setNodeRef}
          type='button'
          {...dragAttributes}
          {...listeners}
        />
        <CompactArtTile
          actionPlacement='caption'
          actions={
            <button
              aria-label='Open details overlay'
              className='builder-picker-detail-action inline-flex items-center justify-center text-slate-400 hover:text-amber-100 focus-visible:text-amber-100 focus-visible:outline-none'
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onOpenDetail()
              }}
              title={`Open ${displayName} details overlay`}
              type='button'
            >
              <FaCircleInfo aria-hidden className='size-3' />
            </button>
          }
          chipPlacement='overlay-stack'
          name={displayName}
          nameClassName='truncate'
          nameTitle={displayName}
          overlay={
            <span
              className='pointer-events-none absolute inset-0 z-10 border'
              style={{borderColor: realmAccent}}
            />
          }
          preview={
            portraitAsset ? (
              <img
                alt={`${displayName} portrait`}
                className={`h-full w-full object-cover ${!isOwned ? 'builder-picker-art-unowned' : ''} ${isDimmed ? 'builder-picker-art-dimmed' : ''}`}
                decoding='async'
                draggable={false}
                fetchPriority='low'
                loading='lazy'
                src={portraitAsset}
              />
            ) : (
              <span className='relative block h-full w-full'>
                <span className='sigil-placeholder' />
              </span>
            )
          }
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
          statusBar={statusSignals}
        />
      </div>
    </div>
  )
}
