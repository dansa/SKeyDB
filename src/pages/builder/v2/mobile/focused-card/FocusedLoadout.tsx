import type {CSSProperties, ReactNode} from 'react'

import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getWheelAssetById} from '@/domain/wheel-assets'

import type {TeamSlot} from '../../../types'
import {BuilderCovenantPlaceholder, BuilderSigilPlaceholder} from '../../BuilderPlaceholders'
import type {WideFocusedStageMetrics} from '../focused-layout'
import type {FocusedCardVariant, WheelOwnedLevels} from './types'

function getLoadoutAssets(slot: TeamSlot) {
  return {
    covenantAsset: slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined,
    wheelAssets: [
      slot.wheels[0] ? getWheelAssetById(slot.wheels[0]) : undefined,
      slot.wheels[1] ? getWheelAssetById(slot.wheels[1]) : undefined,
    ] as const,
  }
}

function GearTile({
  asset,
  onClick,
  ownedLevel,
  variant = 'default',
}: {
  asset?: string
  onClick?: () => void
  ownedLevel: number | null
  variant?: FocusedCardVariant
}) {
  const className = `relative overflow-hidden border border-slate-500/45 bg-slate-900/60 ${
    variant === 'wide' ? 'h-full w-full' : 'w-full'
  } ${
    onClick
      ? 'cursor-pointer transition-[background-color,border-color,box-shadow,filter] hover:border-amber-400/50 hover:bg-slate-900/78 hover:brightness-105'
      : ''
  }`
  const content = asset ? (
    <>
      <span className='absolute inset-[2px] overflow-hidden border border-slate-200/20'>
        <img
          alt=''
          className='h-full w-full object-cover'
          draggable={false}
          src={asset}
          style={{transform: 'scale(1.2)', transformOrigin: 'center'}}
        />
      </span>
      {ownedLevel !== null ? (
        <DupeLevelDisplay
          className='builder-wheel-dupe builder-wheel-dupe-stacked builder-dupe-owned pb-1'
          level={ownedLevel}
        />
      ) : null}
    </>
  ) : (
    <span className='absolute inset-[2px] overflow-hidden border border-slate-700/70 bg-slate-900/60'>
      <BuilderSigilPlaceholder className='absolute inset-0' variant='wheel' />
    </span>
  )

  if (!onClick) {
    return (
      <div className={className} style={{aspectRatio: '430/872'}}>
        {content}
      </div>
    )
  }

  return (
    <button
      className={className}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      style={{aspectRatio: '430/872'}}
      type='button'
    >
      {content}
    </button>
  )
}

function CovenantTile({
  asset,
  className,
  imagePaddingClass,
  onClick,
}: {
  asset?: string
  className: string
  imagePaddingClass: string
  onClick?: () => void
}) {
  const content = asset ? (
    <span className={`flex h-full w-full items-center justify-center ${imagePaddingClass}`}>
      <img
        alt=''
        className='h-full w-full scale-[1.08] object-contain'
        draggable={false}
        src={asset}
      />
    </span>
  ) : (
    <BuilderCovenantPlaceholder className='h-full w-full' />
  )

  if (!onClick) {
    return <div className={className}>{content}</div>
  }

  return (
    <button className={className} onClick={onClick} type='button'>
      {content}
    </button>
  )
}

function getLandscapeLoadoutColumnStyle(layout: WideFocusedStageMetrics) {
  return {
    gridTemplateColumns: `${String(layout.redColumnWidth)}px`,
    gridTemplateRows: `calc(${String(layout.redColumnWidth)}px * 2) calc(${String(
      layout.redColumnWidth,
    )}px * 2) ${String(layout.redColumnWidth)}px`,
    height: `${String(layout.cardHeight)}px`,
    width: `${String(layout.redColumnWidth)}px`,
  }
}

function LoadoutGridFrame({
  children,
  className,
  style,
}: {
  children: ReactNode
  className: string
  style?: CSSProperties
}) {
  return (
    <div className={className} data-testid='mobile-focused-loadout-row' style={style}>
      {children}
    </div>
  )
}

function LoadoutColumnFrame({
  children,
  layout,
}: {
  children: ReactNode
  layout: WideFocusedStageMetrics
}) {
  return (
    <div
      className='grid shrink-0 gap-2'
      data-testid='mobile-focused-loadout-column'
      style={getLandscapeLoadoutColumnStyle(layout)}
    >
      {children}
    </div>
  )
}

function SlotLoadoutTiles({
  covenantButtonClassName,
  covenantImagePaddingClass,
  onCovenantClick,
  onWheelClick,
  slot,
  wheelOwnedLevels,
  wheelVariant = 'default',
}: {
  covenantButtonClassName: string
  covenantImagePaddingClass: string
  onCovenantClick: () => void
  onWheelClick: (wheelIndex: number) => void
  slot: TeamSlot
  wheelOwnedLevels: WheelOwnedLevels
  wheelVariant?: FocusedCardVariant
}) {
  const {covenantAsset, wheelAssets} = getLoadoutAssets(slot)

  return (
    <>
      {wheelAssets.map((asset, index) => (
        <GearTile
          asset={asset}
          key={String(index)}
          onClick={() => {
            onWheelClick(index)
          }}
          ownedLevel={wheelOwnedLevels[index]}
          variant={wheelVariant}
        />
      ))}
      <CovenantTile
        asset={covenantAsset}
        className={covenantButtonClassName}
        imagePaddingClass={covenantImagePaddingClass}
        onClick={onCovenantClick}
      />
    </>
  )
}

function EmptyLoadoutTiles({
  covenantButtonClassName,
  covenantImagePaddingClass,
  wheelVariant = 'default',
}: {
  covenantButtonClassName: string
  covenantImagePaddingClass: string
  wheelVariant?: FocusedCardVariant
}) {
  return (
    <>
      {Array.from({length: 2}, (_, index) => (
        <GearTile key={String(index)} ownedLevel={null} variant={wheelVariant} />
      ))}
      <CovenantTile
        className={covenantButtonClassName}
        imagePaddingClass={covenantImagePaddingClass}
      />
    </>
  )
}

interface FilledLoadoutProps {
  onCovenantClick: () => void
  onWheelClick: (wheelIndex: number) => void
  slot: TeamSlot
  wheelOwnedLevels: WheelOwnedLevels
}

type LoadoutProps =
  | ({
      layout?: WideFocusedStageMetrics
    } & FilledLoadoutProps)
  | {
      layout?: WideFocusedStageMetrics
      onCovenantClick?: undefined
      onWheelClick?: undefined
      slot?: undefined
      wheelOwnedLevels?: undefined
    }

function LoadoutFrame({children, layout}: {children: ReactNode; layout?: WideFocusedStageMetrics}) {
  if (layout) {
    return <LoadoutColumnFrame layout={layout}>{children}</LoadoutColumnFrame>
  }

  return (
    <LoadoutGridFrame className='grid w-full grid-cols-[1fr_1fr_0.8fr] items-start gap-2'>
      {children}
    </LoadoutGridFrame>
  )
}

export function LandscapeLoadout(props: LoadoutProps) {
  const isColumn = Boolean(props.layout)

  const content = !props.slot ? (
    <EmptyLoadoutTiles
      covenantButtonClassName={
        isColumn
          ? 'flex h-full w-full items-center justify-center self-end overflow-hidden border border-slate-700/70 bg-slate-900/60'
          : 'flex aspect-square w-full items-center justify-center self-start overflow-hidden border border-slate-700/70 bg-slate-900/60'
      }
      covenantImagePaddingClass={isColumn ? 'p-1' : 'p-0.5'}
      wheelVariant={isColumn ? 'wide' : 'default'}
    />
  ) : (
    <SlotLoadoutTiles
      covenantButtonClassName={
        isColumn
          ? 'flex h-full w-full cursor-pointer items-center justify-center self-end overflow-hidden border border-slate-500/45 bg-slate-900/60 transition-[background-color,border-color,filter] hover:border-amber-400/50 hover:bg-slate-900/78 hover:brightness-105'
          : 'flex aspect-square w-full cursor-pointer items-center justify-center self-start overflow-hidden border border-slate-500/45 bg-slate-900/60 transition-[background-color,border-color,filter] hover:border-amber-400/50 hover:bg-slate-900/78 hover:brightness-105'
      }
      covenantImagePaddingClass={isColumn ? 'p-1' : 'p-0.5'}
      onCovenantClick={props.onCovenantClick}
      onWheelClick={props.onWheelClick}
      slot={props.slot}
      wheelOwnedLevels={props.wheelOwnedLevels}
      wheelVariant={isColumn ? 'wide' : 'default'}
    />
  )

  return <LoadoutFrame layout={props.layout}>{content}</LoadoutFrame>
}
