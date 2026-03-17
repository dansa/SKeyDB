import type {ReactNode} from 'react'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'

import type {TeamSlot} from '../../../types'
import {BuilderSigilPlaceholder} from '../../BuilderPlaceholders'
import type {FocusedPosse} from './types'

interface SlotThumbnailsProps {
  columnGapClass?: string
  currentIndex: number
  onSelect: (index: number) => void
  orientation?: 'row' | 'column'
  rowGapClass?: string
  size?: number
  slots: TeamSlot[]
  withRowOffset?: boolean
}

function ThumbnailButton({
  alt,
  children,
  disabled,
  isCurrent,
  onClick,
}: {
  alt: string
  children: ReactNode
  disabled?: boolean
  isCurrent: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-current={isCurrent ? 'true' : undefined}
      className={`aspect-square w-full overflow-hidden ${
        isCurrent
          ? 'border-2 border-amber-500/60'
          : 'cursor-pointer border border-slate-500/45 opacity-50'
      }`}
      disabled={disabled}
      onClick={onClick}
      type='button'
    >
      <span className='sr-only'>{alt}</span>
      {children}
    </button>
  )
}

export function SlotThumbnails({
  columnGapClass,
  currentIndex,
  onSelect,
  orientation = 'row',
  rowGapClass,
  size,
  slots,
  withRowOffset = true,
}: SlotThumbnailsProps) {
  const resolvedColumnGapClass = columnGapClass ?? 'gap-1.5'
  const resolvedRowGapClass = rowGapClass ?? 'gap-1.5'
  const wrapperClassName =
    orientation === 'column'
      ? `grid grid-cols-1 ${resolvedColumnGapClass}`
      : `${withRowOffset ? 'mt-2.5 ' : ''}grid w-full grid-cols-4 ${resolvedRowGapClass}`

  return (
    <div
      className={wrapperClassName}
      style={orientation === 'column' && size ? {width: `${String(size)}px`} : undefined}
    >
      {slots.map((slot, index) => {
        const isCurrent = index === currentIndex
        const portrait = slot.awakenerName ? getAwakenerPortraitAsset(slot.awakenerName) : undefined
        const handleSelect = () => {
          if (isCurrent) {
            return
          }

          onSelect(index)
        }

        if (!portrait) {
          return (
            <button
              aria-current={isCurrent ? 'true' : undefined}
              className={`relative flex aspect-square w-full items-center justify-center overflow-hidden border border-dashed border-slate-600 bg-slate-950/55 ${
                isCurrent ? '' : 'opacity-30'
              }`}
              disabled={isCurrent}
              key={slot.slotId}
              onClick={handleSelect}
              type='button'
            >
              <BuilderSigilPlaceholder className='absolute inset-0' variant='thumb' />
            </button>
          )
        }

        return (
          <ThumbnailButton
            alt={slot.awakenerName ?? ''}
            disabled={isCurrent}
            isCurrent={isCurrent}
            key={slot.slotId}
            onClick={handleSelect}
          >
            <span className='relative block h-full w-full'>
              <img alt='' className='h-full w-full object-cover' draggable={false} src={portrait} />
              {slot.isSupport ? (
                <span className='absolute top-0 right-0 border-b border-l border-slate-400/50 bg-slate-950/92 px-1 text-[8px] leading-4 font-bold text-amber-300'>
                  S
                </span>
              ) : null}
            </span>
          </ThumbnailButton>
        )
      })}
    </div>
  )
}

export function FocusedPosseSquareButton({
  onClick,
  posse,
  posseAsset,
  size,
}: {
  onClick: () => void
  posse: FocusedPosse | undefined
  posseAsset?: string
  size: number
}) {
  return (
    <button
      className='relative flex shrink-0 items-end overflow-hidden border border-slate-500/45 bg-slate-950/65 text-left hover:border-amber-300/45'
      data-testid='mobile-focused-posse-rail'
      onClick={onClick}
      style={{height: `${String(size)}px`, width: `${String(size)}px`}}
      type='button'
    >
      {posseAsset ? (
        <img
          alt={posse?.name ?? 'Posse'}
          className='absolute inset-0 h-full w-full object-cover'
          draggable={false}
          src={posseAsset}
        />
      ) : (
        <span className='absolute inset-0 bg-slate-950/55'>
          <BuilderSigilPlaceholder className='absolute inset-0' variant='thumb' />
        </span>
      )}
      <span className='absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90' />
      <span className='relative z-10 block w-full truncate px-1 pb-0.5 text-[7px] font-semibold text-slate-100'>
        {posse?.name ?? 'Not Set'}
      </span>
    </button>
  )
}
