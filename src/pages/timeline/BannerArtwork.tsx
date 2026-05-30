import {useEffect, useMemo, useRef, useState, type MouseEvent} from 'react'

import {Link} from 'react-router-dom'

import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit, BannerPoolSlot} from '@/domain/timeline'

import {
  expandFeatured,
  getFeaturedGridTemplate,
  getPoolGridTemplate,
  getVisualSlotSignature,
  resolveFeaturedAssets,
  resolvePoolSlots,
  type ResolvedVisualSlot,
  type SliceAsset,
} from './timelineArtworkModel'
import {TRANSITION_DURATION_MS, usePoolCycling, type PoolCycleFrame} from './usePoolCycling'
import {usePoolMontagePreload} from './usePoolMontagePreload'

const SLICE_DETAIL_TARGET_CLASS =
  'absolute inset-0 z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-100/95 focus-visible:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.85)]'
const POOL_MONTAGE_LAYER_CLASS =
  'absolute inset-0 overflow-hidden transition-opacity ease-in-out motion-reduce:transition-none'
const EMPTY_FEATURED: BannerFeaturedUnit[] = []
const EMPTY_POOL_SLOTS: BannerPoolSlot[] = []

const noCleanup: () => void = () => undefined

function scheduleAfterNextPaint(callback: () => void): () => void {
  if (
    import.meta.env.MODE === 'test' ||
    typeof window === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function' ||
    typeof window.cancelAnimationFrame !== 'function'
  ) {
    callback()
    return noCleanup
  }

  let secondFrameId: number | undefined
  const firstFrameId = window.requestAnimationFrame(() => {
    secondFrameId = window.requestAnimationFrame(callback)
  })

  return () => {
    window.cancelAnimationFrame(firstFrameId)
    if (secondFrameId !== undefined) {
      window.cancelAnimationFrame(secondFrameId)
    }
  }
}

function isPlainPrimaryClick(event: MouseEvent<HTMLElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
}

function openDetailFromTarget(
  event: MouseEvent<HTMLElement>,
  detailRef: EntityRef | undefined,
  onOpenDetail: ((ref: EntityRef) => void) | undefined,
) {
  if (!detailRef || !onOpenDetail || !isPlainPrimaryClick(event)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  onOpenDetail(detailRef)
}

function SliceDetailTarget({
  asset,
  className,
  onOpenDetail,
}: {
  asset: SliceAsset
  className: string
  onOpenDetail?: (ref: EntityRef) => void
}) {
  if (asset.linkTo) {
    return (
      <Link
        aria-label={asset.label}
        className={className}
        onClick={(event) => {
          openDetailFromTarget(event, asset.detailRef, onOpenDetail)
        }}
        title={asset.label}
        to={asset.linkTo}
      />
    )
  }

  if (!asset.detailRef || !onOpenDetail) {
    return null
  }

  return (
    <button
      aria-label={asset.label}
      className={className}
      onClick={(event) => {
        openDetailFromTarget(event, asset.detailRef, onOpenDetail)
      }}
      title={asset.label}
      type='button'
    />
  )
}

function getArtworkImageClass(asset: SliceAsset, emphasis: boolean): string {
  const base =
    'h-full w-full transition-transform duration-500 ease-out will-change-transform [backface-visibility:hidden] motion-reduce:transition-none'

  if (asset.isWheel) {
    return emphasis
      ? `${base} scale-[1.18] object-cover object-center group-hover/art-panel:scale-[1.24]`
      : `${base} scale-[1.12] object-cover object-center group-hover/art-panel:scale-[1.18]`
  }

  return emphasis
    ? `${base} scale-[1.035] object-cover object-top group-hover/art-panel:scale-[1.08]`
    : `${base} object-cover object-top group-hover/art-panel:scale-[1.045]`
}

function ArtworkFallback({label}: {label?: string}) {
  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(217,196,121,0.14),rgba(8,13,24,0.9)_58%,rgba(2,6,14,1))]'>
      <span className='sigil-placeholder sigil-placeholder-card opacity-80' />
      {label ? (
        <p className='ui-title relative z-10 max-w-[82%] text-center text-xs leading-tight text-amber-50/80'>
          {label}
        </p>
      ) : null}
    </div>
  )
}

function ArtworkVisual({
  asset,
  emphasis = false,
  showFallbackLabel = true,
  loading = 'lazy',
}: {
  asset: SliceAsset
  emphasis?: boolean
  showFallbackLabel?: boolean
  loading?: 'eager' | 'lazy'
}) {
  return asset.url ? (
    <img
      alt={asset.label}
      className={getArtworkImageClass(asset, emphasis)}
      decoding='async'
      draggable={false}
      loading={loading}
      src={asset.url}
    />
  ) : (
    <ArtworkFallback label={showFallbackLabel ? asset.label : undefined} />
  )
}

function SplitPanelSeparator() {
  return (
    <div className='pointer-events-none absolute inset-y-0 right-0 z-20 w-px bg-slate-950/70 shadow-[1px_0_0_rgba(255,244,202,0.045)]' />
  )
}

function ArtworkPanel({
  asset,
  className = '',
  emphasis = false,
  loading = 'lazy',
  onOpenDetail,
  showSeparator = false,
}: {
  asset: SliceAsset
  className?: string
  emphasis?: boolean
  loading?: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
  showSeparator?: boolean
}) {
  return (
    <div
      className={`group/art-panel relative min-w-0 overflow-hidden bg-slate-950 ${className}`}
      title={asset.label}
    >
      <div className='absolute inset-0'>
        <ArtworkVisual asset={asset} emphasis={emphasis} loading={loading} />
      </div>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      {showSeparator ? <SplitPanelSeparator /> : null}
      <SliceDetailTarget
        asset={asset}
        className={SLICE_DETAIL_TARGET_CLASS}
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
}

function FeaturedArtwork({
  assets,
  loading,
  onOpenDetail,
}: {
  assets: SliceAsset[]
  loading: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
}) {
  if (assets.length === 0) {
    return <BannerPlaceholderArt />
  }

  return (
    <div
      className='absolute inset-0 grid bg-slate-950'
      style={{gridTemplateColumns: getFeaturedGridTemplate(assets)}}
    >
      {assets.slice(0, 4).map((asset, index, splitAssets) => (
        <ArtworkPanel
          asset={asset}
          emphasis={index === 0}
          key={`${asset.label}-${String(index)}`}
          loading={loading}
          onOpenDetail={onOpenDetail}
          showSeparator={index < splitAssets.length - 1}
        />
      ))}
    </div>
  )
}

function PoolMontageSlot({
  assets,
  frame,
  loading,
  onOpenDetail,
  showSeparator,
}: {
  assets: SliceAsset[]
  frame: PoolCycleFrame
  loading: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
  showSeparator: boolean
}) {
  const [layers, setLayers] = useState<{a: number; b: number; front: 'a' | 'b'}>({
    a: frame.activeIdx,
    b: frame.activeIdx,
    front: 'a',
  })
  const prevTransRef = useRef(false)
  const promotionCleanupRef = useRef(noCleanup)

  useEffect(() => {
    if (frame.transitioning && !prevTransRef.current && frame.incomingIdx >= 0) {
      promotionCleanupRef.current()
      const back: 'a' | 'b' = layers.front === 'a' ? 'b' : 'a'
      setLayers((prev) => ({...prev, [back]: frame.incomingIdx}))
      promotionCleanupRef.current = scheduleAfterNextPaint(() => {
        setLayers((prev) => ({...prev, front: back}))
        promotionCleanupRef.current = noCleanup
      })
    }
    prevTransRef.current = frame.transitioning
  }, [frame.transitioning, frame.incomingIdx, layers.front])

  useEffect(
    () => () => {
      promotionCleanupRef.current()
    },
    [],
  )

  const assetA = assets[layers.a]
  const assetB = assets[layers.b]
  const frontAsset = layers.front === 'a' ? assetA : assetB
  const transitionStyle = {
    transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
  }

  return (
    <div
      className='group/art-panel group/slice relative min-w-0 overflow-hidden bg-slate-950 [contain:paint]'
      title={frontAsset.label}
    >
      <div
        aria-hidden={layers.front !== 'a'}
        className={POOL_MONTAGE_LAYER_CLASS}
        style={{
          opacity: layers.front === 'a' ? 1 : 0,
          ...transitionStyle,
        }}
      >
        <ArtworkVisual asset={assetA} loading={loading} showFallbackLabel={layers.front === 'a'} />
      </div>
      <div
        aria-hidden={layers.front !== 'b'}
        className={POOL_MONTAGE_LAYER_CLASS}
        style={{
          opacity: layers.front === 'b' ? 1 : 0,
          ...transitionStyle,
        }}
      >
        <ArtworkVisual asset={assetB} loading={loading} showFallbackLabel={layers.front === 'b'} />
      </div>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      {showSeparator ? <SplitPanelSeparator /> : null}
      <SliceDetailTarget
        asset={frontAsset}
        className={SLICE_DETAIL_TARGET_CLASS}
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
}

function PoolMontagePlaceholderSlot({
  asset,
  showSeparator,
}: {
  asset: SliceAsset
  showSeparator: boolean
}) {
  return (
    <div
      className='group/art-panel relative min-w-0 overflow-hidden bg-slate-950 [contain:paint]'
      title={asset.label}
    >
      <ArtworkFallback label={asset.label} />
      {showSeparator ? <SplitPanelSeparator /> : null}
    </div>
  )
}

function PoolMontageArtwork({
  loading,
  onOpenDetail,
  poolSlots,
  visualSlots,
}: {
  loading: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
  poolSlots: BannerPoolSlot[]
  visualSlots: ResolvedVisualSlot[]
}) {
  const {assetsReady, rootRef} = usePoolMontagePreload(visualSlots)
  const cycleFrames = usePoolCycling(poolSlots, {enabled: assetsReady})

  return (
    <div
      className='absolute inset-0 grid bg-slate-950'
      ref={rootRef}
      style={{gridTemplateColumns: getPoolGridTemplate(visualSlots.length)}}
    >
      {assetsReady
        ? visualSlots.map((vs, index) => (
            <PoolMontageSlot
              assets={vs.assets}
              frame={cycleFrames[vs.cycleFrameIndex]}
              key={`${String(index)}:${getVisualSlotSignature(vs)}`}
              loading={loading}
              onOpenDetail={onOpenDetail}
              showSeparator={index < visualSlots.length - 1}
            />
          ))
        : visualSlots.map((vs, index) => (
            <PoolMontagePlaceholderSlot
              asset={vs.assets[0]}
              key={`${String(index)}:${getVisualSlotSignature(vs)}`}
              showSeparator={index < visualSlots.length - 1}
            />
          ))}
    </div>
  )
}

function BannerPlaceholderArt() {
  return (
    <div className='absolute inset-0'>
      <ArtworkFallback label='Select your own rate-up' />
    </div>
  )
}

function FullCardArtwork({
  label,
  loading,
  url,
}: {
  label: string
  loading: 'eager' | 'lazy'
  url: string
}) {
  return (
    <div className='absolute inset-0 overflow-hidden bg-slate-950'>
      <img
        alt={label}
        className='h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover/banner:scale-[1.035] motion-reduce:transition-none'
        decoding='async'
        draggable={false}
        loading={loading}
        src={url}
      />
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,14,0.04),rgba(2,6,14,0.08)_42%,rgba(2,6,14,0.48)),linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.08)_58%,rgba(2,6,14,0.68))]' />
    </div>
  )
}

interface BannerArtworkProps {
  customArt?: string
  featured?: BannerFeaturedUnit[]
  loading?: 'eager' | 'lazy'
  poolSlots?: BannerPoolSlot[]
  title: string
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerArtwork({
  customArt,
  featured,
  loading = 'lazy',
  poolSlots,
  title,
  onOpenDetail,
}: BannerArtworkProps) {
  const effectiveFeatured = featured ?? EMPTY_FEATURED
  const displaySlices = useMemo(() => expandFeatured(effectiveFeatured), [effectiveFeatured])
  const displayAssets = useMemo(() => resolveFeaturedAssets(displaySlices), [displaySlices])
  const effectivePoolSlots = poolSlots ?? EMPTY_POOL_SLOTS
  const visualSlots = useMemo(
    () => (effectivePoolSlots.length > 0 ? resolvePoolSlots(effectivePoolSlots) : null),
    [effectivePoolSlots],
  )

  if (customArt) {
    return <FullCardArtwork label={title} loading={loading} url={customArt} />
  }

  if (visualSlots && visualSlots.length > 0) {
    return (
      <PoolMontageArtwork
        loading={loading}
        onOpenDetail={onOpenDetail}
        poolSlots={effectivePoolSlots}
        visualSlots={visualSlots}
      />
    )
  }

  return <FeaturedArtwork assets={displayAssets} loading={loading} onOpenDetail={onOpenDetail} />
}
