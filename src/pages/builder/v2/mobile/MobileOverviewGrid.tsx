import type {CSSProperties, ReactNode} from 'react'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getWheelAssetById} from '@/domain/wheel-assets'

import type {TeamSlot} from '../../types'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveSelection, selectActiveTeamSlots} from '../store/selectors'
import {useCollectionOwnership} from '../useCollectionOwnership'
import {useMeasuredElementSize} from './layout-hooks'
import {getMobileCardFrameStyle, getOverviewGridMetrics} from './mobile-layout-metrics'

interface MobileOverviewGridProps {
  onFocusSlot: (slotIndex: number) => void
  onDeployEmpty: (slotIndex: number) => void
}

export function MobileOverviewGrid({onFocusSlot, onDeployEmpty}: MobileOverviewGridProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const {height, ref, width} = useMeasuredElementSize()
  const metrics = getOverviewGridMetrics(width || window.innerWidth, height || window.innerHeight)
  const shouldLetPageScroll = metrics.requiresPageScroll
  const cardStyle = getMobileCardFrameStyle({
    cardHeight: metrics.cardHeight,
    cardWidth: metrics.cardWidth,
  })

  return (
    <div
      className={shouldLetPageScroll ? 'min-h-0' : 'h-full min-h-0'}
      ref={ref}
      style={shouldLetPageScroll ? {minHeight: `${String(metrics.totalGridHeight)}px`} : undefined}
    >
      <div
        className={`grid content-start gap-2 px-2 py-2 ${
          shouldLetPageScroll ? '' : 'h-full min-h-0 overflow-y-auto'
        }`.trim()}
        data-columns={String(metrics.columns)}
        data-rows={String(metrics.rows)}
        data-testid='mobile-overview-grid'
        style={{
          gridTemplateColumns: `repeat(${String(metrics.columns)}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${String(metrics.rows)}, ${String(metrics.cardHeight)}px)`,
        }}
      >
        {slots.map((slot, index) => {
          if (!slot.awakenerName) {
            return (
              <OverviewCellFrame key={slot.slotId}>
                <EmptySlotCell
                  cardStyle={cardStyle}
                  onDeploy={() => {
                    onDeployEmpty(index)
                  }}
                />
              </OverviewCellFrame>
            )
          }

          const isActive =
            activeSelection?.slotId === slot.slotId && activeSelection.kind === 'awakener'

          return (
            <OverviewCellFrame key={slot.slotId}>
              <PopulatedSlotCell
                cardStyle={cardStyle}
                isActive={isActive}
                onFocus={() => {
                  onFocusSlot(index)
                }}
                slot={slot}
              />
            </OverviewCellFrame>
          )
        })}
      </div>
    </div>
  )
}

function OverviewCellFrame({children}: {children: ReactNode}) {
  return <div className='flex h-full min-h-0 items-start justify-center'>{children}</div>
}

function EmptySlotCell({cardStyle, onDeploy}: {cardStyle: CSSProperties; onDeploy: () => void}) {
  return (
    <button
      className='relative flex min-h-0 cursor-pointer items-center justify-center overflow-hidden border border-slate-500/60 bg-slate-700/15'
      onClick={onDeploy}
      style={cardStyle}
      type='button'
    >
      <div className='z-10 text-center'>
        <div className='mx-auto mb-1 flex h-8 w-8 rotate-45 items-center justify-center border border-dashed border-slate-600'>
          <span className='-rotate-45 text-sm text-slate-500'>+</span>
        </div>
        <span className='text-[9px] text-slate-500'>Deploy</span>
      </div>
    </button>
  )
}

function PopulatedSlotCell({
  cardStyle,
  isActive,
  onFocus,
  slot,
}: {
  cardStyle: CSSProperties
  slot: TeamSlot
  isActive: boolean
  onFocus: () => void
}) {
  const {ownedAwakenerLevelByName} = useCollectionOwnership()
  const displayName = slot.awakenerName ? formatAwakenerNameForUi(slot.awakenerName) : ''
  const cardAsset = slot.awakenerName ? getAwakenerCardAsset(slot.awakenerName) : undefined
  const ownedAwakenerLevel = slot.awakenerName
    ? (ownedAwakenerLevelByName.get(slot.awakenerName) ?? null)
    : null

  return (
    <button
      className={`relative min-h-0 cursor-pointer overflow-hidden border ${
        isActive
          ? 'border-amber-400/75 shadow-[inset_0_-2px_0_0_rgba(251,146,60,0.9),0_0_16px_rgba(251,191,36,0.28)]'
          : 'border-slate-500/60'
      }`}
      onClick={onFocus}
      style={cardStyle}
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
            'linear-gradient(180deg, rgba(8,15,28,0.24) 0%, rgba(8,15,28,0.1) 48%, rgba(1,5,12,0.32) 72%, rgba(1,5,12,0.84) 100%)',
        }}
      />

      <div
        className='absolute inset-x-0 top-0 z-10 px-1.5 pt-1 pb-5'
        style={{
          background:
            'linear-gradient(180deg, rgba(8,15,28,0.8) 0%, rgba(8,15,28,0.42) 52%, transparent 100%)',
        }}
      >
        <p
          className='text-sm leading-none font-bold text-slate-100'
          style={{textShadow: '0 1px 2px rgba(1,5,12,0.92)'}}
        >
          {displayName}
        </p>
      </div>

      <OverviewHud ownedAwakenerLevel={ownedAwakenerLevel} slot={slot} />
    </button>
  )
}

function OverviewHud({
  slot,
  ownedAwakenerLevel,
}: {
  slot: TeamSlot
  ownedAwakenerLevel: number | null
}) {
  const wheel0Asset = slot.wheels[0] ? getWheelAssetById(slot.wheels[0]) : undefined
  const wheel1Asset = slot.wheels[1] ? getWheelAssetById(slot.wheels[1]) : undefined
  const covenantAsset = slot.covenantId ? getCovenantAssetById(slot.covenantId) : undefined

  return (
    <div
      className='absolute inset-x-0 bottom-0 z-20 flex h-[44%] min-h-0 flex-col justify-end px-1.5 pb-1.5'
      style={{
        background:
          'linear-gradient(180deg, rgba(1,5,12,0) 0%, rgba(1,5,12,0.08) 22%, rgba(1,5,12,0.44) 48%, rgba(1,5,12,0.9) 82%, rgba(1,5,12,0.96) 100%)',
        boxShadow: 'inset 0 -2px 0 0 rgba(251,146,60,0.42)',
      }}
    >
      <div className='min-w-0 pb-1'>
        <OverviewMetaStrip level={slot.level ?? 60} ownedAwakenerLevel={ownedAwakenerLevel} />
      </div>

      <div className='flex h-[52%] min-h-0 items-end justify-start gap-1.5'>
        <OverviewWheelChip asset={wheel0Asset} testId='mobile-overview-wheel-0' />
        <OverviewWheelChip asset={wheel1Asset} testId='mobile-overview-wheel-1' />
        <OverviewCovenantTile asset={covenantAsset} />
      </div>
    </div>
  )
}

function OverviewMetaStrip({
  level,
  ownedAwakenerLevel,
}: {
  level: number
  ownedAwakenerLevel: number | null
}) {
  const filledDiamondCount = ownedAwakenerLevel === null ? 0 : Math.min(ownedAwakenerLevel, 3)
  const overflowLevel =
    ownedAwakenerLevel !== null && ownedAwakenerLevel > 3 ? ownedAwakenerLevel - 3 : 0
  const diamondSlots = [0, 1, 2]

  return (
    <>
      <p className='sr-only'>
        {`Lv. ${String(level)}, Enlighten ${String(ownedAwakenerLevel ?? 0)}`}
      </p>
      <svg
        aria-hidden
        className='block h-auto w-[64%] overflow-visible'
        data-testid='mobile-overview-meta-strip'
        viewBox='0 0 172 24'
      >
        <text
          fill='rgba(248,250,252,0.98)'
          fontFamily="'Droid Serif', Georgia, serif"
          fontSize='20'
          fontWeight='700'
          letterSpacing='0.4'
          paintOrder='stroke'
          stroke='rgba(1,5,12,0.9)'
          strokeWidth='2.1'
          x='0'
          y='19'
        >
          {`Lv. ${String(level)}`}
        </text>
        {diamondSlots.map((slotIndex) => {
          const x = 64 + slotIndex * 26

          return (
            <g key={slotIndex} transform={`translate(${String(x)} 0)`}>
              <rect
                fill='none'
                height='18'
                stroke='rgba(244,234,196,0.42)'
                strokeWidth='1.1'
                width='18'
                x='3'
                y='3'
              />
              <polygon
                fill='rgba(4,10,20,0.88)'
                points='12,1.75 22.25,12 12,22.25 1.75,12'
                stroke='rgba(244,234,196,0.68)'
                strokeWidth='1.1'
              />
              {slotIndex < filledDiamondCount ? (
                <polygon
                  fill='rgba(248,243,214,0.72)'
                  points='12,6.6 17.4,12 12,17.4 6.6,12'
                  stroke='rgba(248,243,214,0.95)'
                  strokeWidth='0.9'
                />
              ) : null}
            </g>
          )
        })}
        <g transform='translate(142 0)'>
          <rect
            fill='none'
            height='18'
            stroke='rgba(244,234,196,0.42)'
            strokeWidth='1.1'
            width='18'
            x='3'
            y='3'
          />
          <polygon
            fill='rgba(4,10,20,0.88)'
            points='12,1.75 22.25,12 12,22.25 1.75,12'
            stroke='rgba(244,234,196,0.68)'
            strokeWidth='1.1'
          />
          {overflowLevel > 0 ? (
            <text
              dominantBaseline='central'
              fill='rgba(244,234,196,0.96)'
              fontFamily='Droid Serif, Georgia, serif'
              fontSize='14'
              fontWeight='700'
              paintOrder='stroke'
              stroke='rgba(8,14,24,0.9)'
              strokeWidth='2'
              textAnchor='middle'
              x='12'
              y='12'
            >
              {overflowLevel}
            </text>
          ) : null}
        </g>
      </svg>
    </>
  )
}

function OverviewWheelChip({asset, testId}: {asset?: string; testId: string}) {
  const sharedClassName = 'relative aspect-[1/2] h-full max-h-full shrink-0 overflow-hidden'

  if (!asset) {
    return (
      <div
        className={`${sharedClassName} border border-dashed border-slate-700/70 bg-slate-900/50`}
        data-testid={`${testId}-empty`}
      >
        <span className='absolute inset-0 flex items-center justify-center text-[7px] text-slate-600'>
          +
        </span>
      </div>
    )
  }

  return (
    <div
      className={`${sharedClassName} border border-slate-300/35 bg-slate-700/20`}
      data-testid={`${testId}-filled`}
    >
      <span className='absolute inset-[1px] overflow-hidden border border-slate-200/15'>
        <img
          alt=''
          className='h-full w-full object-cover'
          draggable={false}
          src={asset}
          style={{transform: 'scale(1.08)', transformOrigin: 'center'}}
        />
      </span>
    </div>
  )
}

function OverviewCovenantTile({asset}: {asset?: string}) {
  if (!asset) {
    return (
      <div
        className='flex aspect-square h-[60%] max-h-full shrink-0 items-center justify-center self-end border border-dashed border-slate-600 bg-slate-900/55'
        data-testid='mobile-overview-covenant-empty'
      >
        <span className='text-[7px] text-slate-600'>+</span>
      </div>
    )
  }

  return (
    <div
      className='flex aspect-square h-[60%] max-h-full shrink-0 items-center justify-center self-end overflow-hidden border border-slate-300/35 bg-slate-900/45 p-[2px]'
      data-testid='mobile-overview-covenant-filled'
    >
      <img
        alt=''
        className='h-full w-full scale-[1.75] object-cover'
        draggable={false}
        src={asset}
      />
    </div>
  )
}
