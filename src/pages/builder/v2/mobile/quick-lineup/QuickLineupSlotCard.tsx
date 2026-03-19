import type {CSSProperties} from 'react'

import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getWheelAssetById} from '@/domain/wheel-assets'

import type {TeamSlot} from '../../../types'
import {BuilderCovenantPlaceholder, BuilderSigilPlaceholder} from '../../BuilderPlaceholders'
import {getQuickLineupStepForTarget, type QuickLineupSlotTarget} from '../../quick-lineup-model'
import type {QuickLineupStep} from '../../store/types'
import {getQuickLineupSlotCardMetrics} from '../quick-lineup-layout'

interface QuickLineupSlotCardProps {
  activeTarget: QuickLineupSlotTarget | null
  cardHeight: number
  cardWidth: number
  isActiveSlot: boolean
  layout: 'portrait' | 'landscape'
  onJumpToStep: (step: QuickLineupStep) => void
  slot: TeamSlot
  slotIndex: number
}

export function QuickLineupSlotCard({
  activeTarget,
  cardHeight,
  cardWidth,
  isActiveSlot,
  layout,
  onJumpToStep,
  slot,
  slotIndex,
}: QuickLineupSlotCardProps) {
  const displayName = slot.awakenerName
    ? formatAwakenerNameForUi(slot.awakenerName)
    : `Slot ${String(slotIndex + 1)}`
  const portraitAsset = slot.awakenerName
    ? (getAwakenerCardAsset(slot.awakenerName) ?? getAwakenerPortraitAsset(slot.awakenerName))
    : undefined
  const wheel0Asset = slot.wheels[0] ? getWheelAssetById(slot.wheels[0]) : undefined
  const wheel1Asset = slot.wheels[1] ? getWheelAssetById(slot.wheels[1]) : undefined
  const covenantAsset = slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined
  const cardMetrics = getQuickLineupSlotCardMetrics(cardWidth, cardHeight, layout)
  const frameStyle: CSSProperties = {
    height: `${String(cardHeight)}px`,
    width: `${String(cardWidth)}px`,
  }
  const visualZoneStyle: CSSProperties =
    layout === 'portrait'
      ? {height: `${String(cardMetrics.visualSize)}px`}
      : {width: `${String(cardMetrics.visualSize)}px`}
  const shellClassName =
    layout === 'portrait' ? 'flex h-full flex-col bg-slate-950/85' : 'flex h-full'
  const visualZoneClassName =
    layout === 'portrait' ? 'relative shrink-0' : 'relative h-full shrink-0'
  const wheelZoneClassName =
    layout === 'portrait'
      ? 'flex min-w-0 flex-1 items-start gap-0.5 bg-slate-950/85 p-0.5'
      : 'flex min-w-0 flex-1 items-center gap-0.5 bg-slate-950/85 p-0.5'
  const wheelSlotFrameClassName =
    layout === 'portrait' ? 'flex min-w-0 flex-1 items-start' : 'flex min-w-0 flex-1 items-center'

  return (
    <div
      className={`overflow-hidden border bg-slate-950/70 transition-[background-color,border-color,box-shadow,filter] ${
        isActiveSlot
          ? 'border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.2)] hover:brightness-105'
          : 'border-slate-500/45 hover:border-amber-300/45 hover:bg-slate-950/82 hover:brightness-105'
      }`}
      data-active-slot={String(isActiveSlot)}
      data-layout={layout}
      data-testid={`quick-lineup-slot-card-${slot.slotId}`}
      style={frameStyle}
    >
      <div className={shellClassName}>
        <div
          className={visualZoneClassName}
          data-testid={`quick-lineup-visual-zone-${slot.slotId}`}
          style={visualZoneStyle}
        >
          <PortraitButton
            asset={portraitAsset}
            className='h-full w-full'
            displayName={displayName}
            onClick={() => {
              onJumpToStep(getQuickLineupStepForTarget(slot.slotId, 'awakener'))
            }}
            slotId={slot.slotId}
            target='awakener'
            targetIsActive={activeTarget === 'awakener'}
          />
          <GearTargetButton
            asset={covenantAsset}
            assetScale={1.75}
            className='absolute right-1 bottom-1 shadow-[0_2px_12px_rgba(8,15,28,0.45)]'
            filled={Boolean(slot.covenantId)}
            floating
            label='Cov'
            onClick={() => {
              onJumpToStep(getQuickLineupStepForTarget(slot.slotId, 'covenant'))
            }}
            slotId={slot.slotId}
            style={{
              height: `${String(cardMetrics.covenantSize)}px`,
              width: `${String(cardMetrics.covenantSize)}px`,
            }}
            showLabel={false}
            target='covenant'
            targetIsActive={activeTarget === 'covenant'}
          />
        </div>
        <div className={wheelZoneClassName} data-testid={`quick-lineup-wheels-zone-${slot.slotId}`}>
          <div className={wheelSlotFrameClassName}>
            <GearTargetButton
              asset={wheel0Asset}
              className='w-full min-w-0'
              filled={Boolean(slot.wheels[0])}
              label='W1'
              onClick={() => {
                onJumpToStep(getQuickLineupStepForTarget(slot.slotId, 'wheel-0'))
              }}
              slotId={slot.slotId}
              style={{height: `${String(cardMetrics.wheelHeight)}px`}}
              target='wheel-0'
              targetIsActive={activeTarget === 'wheel-0'}
            />
          </div>
          <div className={wheelSlotFrameClassName}>
            <GearTargetButton
              asset={wheel1Asset}
              className='w-full min-w-0'
              filled={Boolean(slot.wheels[1])}
              label='W2'
              onClick={() => {
                onJumpToStep(getQuickLineupStepForTarget(slot.slotId, 'wheel-1'))
              }}
              slotId={slot.slotId}
              style={{height: `${String(cardMetrics.wheelHeight)}px`}}
              target='wheel-1'
              targetIsActive={activeTarget === 'wheel-1'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function PortraitButton({
  asset,
  className,
  displayName,
  onClick,
  slotId,
  target,
  targetIsActive,
}: {
  asset?: string
  className?: string
  displayName: string
  onClick: () => void
  slotId: string
  target: QuickLineupSlotTarget
  targetIsActive: boolean
}) {
  return (
    <button
      className={`relative min-h-0 overflow-hidden ${
        targetIsActive
          ? 'ring-1 ring-amber-300/90 ring-inset hover:brightness-105'
          : 'transition-[filter,box-shadow] hover:brightness-105'
      } ${className ?? ''}`}
      data-active-target={String(targetIsActive)}
      data-filled={String(Boolean(asset))}
      data-testid={`quick-lineup-target-${slotId}-${target}`}
      onClick={onClick}
      type='button'
    >
      {asset ? (
        <img
          alt={`${displayName} card`}
          className='absolute inset-0 h-full w-full object-cover object-top'
          draggable={false}
          src={asset}
        />
      ) : (
        <span className='absolute inset-0 flex items-center justify-center bg-slate-900/70'>
          <span className='relative block h-[74%] max-h-20 w-[74%] max-w-20'>
            <BuilderSigilPlaceholder className='absolute inset-0' variant='card' />
          </span>
        </span>
      )}
      <span
        className='pointer-events-none absolute inset-0'
        style={{
          background:
            'linear-gradient(180deg, rgba(8,15,28,0.82) 0%, rgba(8,15,28,0.2) 32%, rgba(8,15,28,0.12) 68%, rgba(8,15,28,0.88) 100%)',
        }}
      />
      <span className='absolute inset-x-0 top-0 px-1.5 pt-1'>
        <span
          className='block truncate text-[10px] leading-none font-bold text-slate-100'
          style={{textShadow: '0 1px 2px rgba(8,15,28,0.92)'}}
        >
          {displayName}
        </span>
      </span>
    </button>
  )
}

function GearTargetButton({
  asset,
  assetScale = 1.08,
  className,
  filled,
  floating = false,
  label,
  onClick,
  showLabel = true,
  slotId,
  style,
  target,
  targetIsActive,
}: {
  asset?: string
  assetScale?: number
  className: string
  filled: boolean
  floating?: boolean
  label: string
  onClick: () => void
  showLabel?: boolean
  slotId: string
  style?: CSSProperties
  target: QuickLineupSlotTarget
  targetIsActive: boolean
}) {
  return (
    <button
      className={`${floating ? 'absolute' : 'relative'} min-h-0 overflow-hidden border bg-slate-900/60 transition-[background-color,border-color,box-shadow,filter] ${
        targetIsActive
          ? 'border-amber-300/90 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.6)] hover:brightness-105'
          : filled
            ? 'border-slate-300/30 hover:border-amber-300/45 hover:bg-slate-900/72 hover:brightness-105'
            : 'border-slate-700/60 hover:border-amber-300/45 hover:bg-slate-900/72 hover:brightness-105'
      } ${className}`}
      data-active-target={String(targetIsActive)}
      data-filled={String(filled)}
      data-testid={`quick-lineup-target-${slotId}-${target}`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {asset ? (
        <span className='absolute inset-[1px] overflow-hidden'>
          <img
            alt=''
            className='h-full w-full object-cover'
            draggable={false}
            src={asset}
            style={{transform: `scale(${String(assetScale)})`, transformOrigin: 'center'}}
          />
        </span>
      ) : (
        <span className='absolute inset-[1px] overflow-hidden bg-slate-950/70'>
          {target === 'covenant' ? (
            <BuilderCovenantPlaceholder className='h-full w-full' />
          ) : (
            <BuilderSigilPlaceholder className='absolute inset-0' variant='wheel' />
          )}
        </span>
      )}
      {showLabel ? (
        <span className='absolute right-0 bottom-0 bg-slate-950/85 px-1 py-0.5 text-[7px] leading-none text-slate-300'>
          {label}
        </span>
      ) : null}
    </button>
  )
}
