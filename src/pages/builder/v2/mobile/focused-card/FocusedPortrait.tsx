import type {ReactNode} from 'react'

import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'
import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getRealmTint, normalizeRealmId} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import type {TeamSlot} from '../../../types'
import {BuilderSigilPlaceholder} from '../../BuilderPlaceholders'
import {getMobileCardFrameStyle} from '../mobile-layout-metrics'

interface FocusedPortraitProps {
  cardHeight?: number
  footer?: ReactNode
  onChangeAwakener: () => void
  slot: TeamSlot
}

export function FocusedPortrait({
  cardHeight,
  footer,
  onChangeAwakener,
  slot,
}: FocusedPortraitProps) {
  const displayName = slot.awakenerName ? formatAwakenerNameForUi(slot.awakenerName) : ''
  const cardAsset = slot.awakenerName ? getAwakenerCardAsset(slot.awakenerName) : undefined
  const realmTint = slot.realm ? getRealmTint(normalizeRealmId(slot.realm)) : undefined

  return (
    <button
      className='relative block w-full cursor-pointer overflow-hidden border border-amber-400/75 transition-[border-color,box-shadow,filter] hover:border-amber-300/90 hover:brightness-105'
      onClick={onChangeAwakener}
      style={{
        ...getMobileCardFrameStyle({cardHeight}),
        boxShadow: '0 0 16px rgba(251,191,36,0.28)',
      }}
      type='button'
    >
      {cardAsset ? (
        <img
          alt={`${displayName} card`}
          className='absolute inset-0 h-full w-full object-cover object-top'
          draggable={false}
          src={cardAsset}
        />
      ) : null}

      <div
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'linear-gradient(180deg, rgba(8,15,28,0.72) 0%, transparent 34%, transparent 66%, rgba(8,15,28,0.62) 100%)',
        }}
      />

      <div
        className='absolute inset-x-0 top-0 z-10 px-2 pt-1.5 pb-5'
        style={{background: 'linear-gradient(180deg, rgba(8,15,28,0.8) 0%, transparent 100%)'}}
      >
        <p className='text-sm leading-none font-bold text-slate-100'>{displayName}</p>
        {slot.isSupport ? (
          <span className='mt-1 inline-flex border border-amber-300/45 bg-slate-950/88 px-1.5 py-0.5 text-[9px] leading-none font-bold tracking-[0.08em] text-amber-200 uppercase'>
            Support Awakener
          </span>
        ) : null}
        {slot.realm ? (
          <p className='mt-0.5 text-[9px]' style={{color: realmTint}}>
            {slot.realm.charAt(0).toUpperCase() + slot.realm.slice(1).toLowerCase()}
          </p>
        ) : null}
      </div>

      {footer ? (
        <div
          className='pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2 pt-6 pb-1.5'
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(8,15,28,0.88) 100%)',
          }}
        >
          {footer}
        </div>
      ) : null}
    </button>
  )
}

export function FocusedPortraitFooter({
  awakenerOwnedLevel,
  slot,
}: {
  awakenerOwnedLevel: number | null
  slot: TeamSlot
}) {
  return (
    <div className='flex items-end justify-between gap-3 text-left'>
      <p className='sr-only'>
        {`Lv. ${String(slot.level ?? 60)}, ${slot.isSupport ? 'Support Awakener, ' : ''}Enlighten ${String(awakenerOwnedLevel ?? 0)}`}
      </p>
      <p className='text-xs font-bold text-slate-100'>
        <span className='text-[10px] text-slate-300'>Lv.</span>
        {String(slot.level ?? 60)}
      </p>
      {awakenerOwnedLevel !== null ? (
        <div className='w-[88px] shrink-0'>
          <DupeLevelDisplay
            className='builder-awakener-dupe-meta builder-dupe-owned'
            level={awakenerOwnedLevel}
          />
        </div>
      ) : null}
    </div>
  )
}

export function EmptySlotDisplay({
  cardHeight,
  onChangeAwakener,
}: {
  cardHeight?: number
  onChangeAwakener: () => void
}) {
  return (
    <button
      className='flex w-full items-center justify-center border border-slate-500/60 bg-slate-700/15 transition-[background-color,border-color,box-shadow,filter] hover:border-amber-300/45 hover:bg-slate-800/20 hover:brightness-105'
      onClick={onChangeAwakener}
      style={getMobileCardFrameStyle({cardHeight})}
      type='button'
    >
      <div className='text-center'>
        <div className='relative mx-auto mb-1 h-[4.5rem] max-h-[42%] w-[4.5rem] max-w-[42%]'>
          <BuilderSigilPlaceholder className='absolute inset-0' variant='card' />
        </div>
        <span className='text-xs text-slate-500'>Deploy Awakener</span>
      </div>
    </button>
  )
}
