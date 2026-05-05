import {useDraggable} from '@dnd-kit/core'
import {FaArrowUpRightFromSquare, FaCircleInfo} from 'react-icons/fa6'

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
  onOpenDatabasePage: () => void
  onOpenDetail: () => void
}

function getAwakenerStatusText(isRealmBlocked: boolean, isInUse: boolean): string | null {
  if (isInUse && isRealmBlocked) {
    return 'Already Used / Wrong Realm'
  }
  if (isInUse) {
    return 'Already Used'
  }
  if (isRealmBlocked) {
    return 'Wrong Realm'
  }
  return null
}

function getAwakenerTopLabel(
  statusText: string | null,
  isOwned: boolean,
): {text: string; className: string} | null {
  if (statusText) {
    return {
      text: statusText,
      className: PICKER_STATUS_CLASS,
    }
  }
  if (!isOwned) {
    return {
      text: 'Unowned',
      className: PICKER_UNOWNED_CLASS,
    }
  }
  return null
}

export function PickerAwakenerTile({
  awakenerName,
  awakenerId,
  realm,
  isRealmBlocked,
  isInUse,
  isOwned,
  onClick,
  onOpenDatabasePage,
  onOpenDetail,
}: PickerAwakenerTileProps) {
  const displayName = formatAwakenerNameForUi(awakenerName)
  const portraitAsset = getAwakenerPortraitAsset(awakenerName)
  const isDimmed = isRealmBlocked || isInUse
  const realmAccent = getRealmAccent(realm)
  const topLabel = getAwakenerTopLabel(getAwakenerStatusText(isRealmBlocked, isInUse), isOwned)
  const {attributes, listeners, isDragging, setNodeRef} = useDraggable({
    id: `picker:${awakenerId}`,
    data: {kind: 'picker-awakener', awakenerId, awakenerName} satisfies DragData,
  })
  const dragAttributes = {...attributes} as Record<string, unknown>
  delete dragAttributes['aria-disabled']

  return (
    <div className='group relative'>
      <button
        className={`builder-picker-tile border border-slate-500/45 bg-slate-900/55 p-1 text-left transition-colors hover:border-amber-200/45 ${
          isDragging ? 'scale-[0.98] opacity-60' : ''
        } ${isDimmed ? 'opacity-55' : ''}`}
        data-realm-blocked={isRealmBlocked ? 'true' : 'false'}
        data-in-use={isInUse ? 'true' : 'false'}
        onClick={onClick}
        ref={setNodeRef}
        type='button'
        {...dragAttributes}
        {...listeners}
      >
        <CompactArtTile
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
                draggable={false}
                src={portraitAsset}
              />
            ) : (
              <span className='relative block h-full w-full'>
                <span className='sigil-placeholder' />
              </span>
            )
          }
          previewClassName='aspect-square border border-slate-400/35 bg-slate-900/70'
          statusBar={
            topLabel ? <span className={topLabel.className}>{topLabel.text}</span> : undefined
          }
        />
      </button>
      <div className='absolute top-1 right-1 z-30 flex gap-1'>
        <button
          aria-label='Open details overlay'
          className='inline-flex h-6 w-6 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onOpenDetail()
          }}
          type='button'
          title={`Open ${displayName} details overlay`}
        >
          <FaCircleInfo aria-hidden className='h-3 w-3' />
        </button>
        <button
          aria-label='Open database page'
          className='inline-flex h-6 w-6 items-center justify-center border border-slate-200/25 bg-slate-950/85 text-slate-200 hover:border-amber-200/55 hover:text-amber-100'
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onOpenDatabasePage()
          }}
          type='button'
          title={`Open ${displayName} database page`}
        >
          <FaArrowUpRightFromSquare aria-hidden className='h-3 w-3' />
        </button>
      </div>
    </div>
  )
}
