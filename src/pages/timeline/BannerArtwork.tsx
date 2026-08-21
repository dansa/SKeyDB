import {useEffect, useMemo, useReducer, useRef, useState, type MouseEvent} from 'react'

import {Link} from 'react-router'

import type {EntityRef} from '@/domain/entities/types'
import type {BannerFeaturedUnit, BannerLinkedPresentation, BannerPoolSlot} from '@/domain/timeline'

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

const SLICE_DETAIL_TARGET_BASE_CLASS =
  'absolute z-30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-amber-100/95 focus-visible:shadow-[inset_0_0_0_1px_rgba(15,23,42,0.85)]'
const SLICE_DETAIL_TARGET_CLASS = `${SLICE_DETAIL_TARGET_BASE_CLASS} inset-0`
const POOL_MONTAGE_LAYER_CLASS =
  'absolute inset-0 overflow-hidden transition-opacity ease-in-out motion-reduce:transition-none'
const POOL_MONTAGE_TRANSITION_STYLE = {
  transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
}
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
          key={`${asset.label}:${asset.url ?? asset.linkTo ?? 'unlinked'}`}
          loading={loading}
          onOpenDetail={onOpenDetail}
          showSeparator={index < splitAssets.length - 1}
        />
      ))}
    </div>
  )
}

type PoolMontageLayer = 'a' | 'b'

interface PoolMontageLayerState {
  aIdx: number
  bIdx: number
  front: PoolMontageLayer
  pendingFront: PoolMontageLayer | null
}

type PoolMontageLayerAction =
  | {
      type: 'beginTransition'
      activeIdx: number
      incomingIdx: number
    }
  | {type: 'promotePendingLayer'}

function createPoolMontageLayerState(activeIdx: number): PoolMontageLayerState {
  return {
    aIdx: activeIdx,
    bIdx: activeIdx,
    front: 'a',
    pendingFront: null,
  }
}

function poolMontageLayerReducer(
  state: PoolMontageLayerState,
  action: PoolMontageLayerAction,
): PoolMontageLayerState {
  switch (action.type) {
    case 'beginTransition': {
      if (action.incomingIdx < 0) return state

      if (state.front === 'a') {
        return {
          aIdx: action.activeIdx,
          bIdx: action.incomingIdx,
          front: state.front,
          pendingFront: 'b',
        }
      }

      return {
        aIdx: action.incomingIdx,
        bIdx: action.activeIdx,
        front: state.front,
        pendingFront: 'a',
      }
    }

    case 'promotePendingLayer':
      return state.pendingFront ? {...state, front: state.pendingFront, pendingFront: null} : state
  }
}

function getPoolMontageRenderLayers(
  state: PoolMontageLayerState,
  frame: PoolCycleFrame,
): PoolMontageLayerState {
  if (state.pendingFront || frame.transitioning) return state

  return state.front === 'a' ? {...state, aIdx: frame.activeIdx} : {...state, bIdx: frame.activeIdx}
}

function PoolMontageSlot({
  alternateAssets,
  assets,
  frame,
  label,
  loading,
  onOpenDetail,
  presentation,
  showSeparator,
  showAlternate,
}: {
  alternateAssets?: SliceAsset[]
  assets: SliceAsset[]
  frame: PoolCycleFrame
  label?: string
  loading: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
  presentation: BannerLinkedPresentation
  showSeparator: boolean
  showAlternate: boolean
}) {
  const [layerState, dispatchLayerState] = useReducer(
    poolMontageLayerReducer,
    frame.activeIdx,
    createPoolMontageLayerState,
  )
  const prevTransRef = useRef(false)
  const promotionCleanupRef = useRef(noCleanup)

  useEffect(() => {
    if (frame.transitioning && !prevTransRef.current && frame.incomingIdx >= 0) {
      promotionCleanupRef.current()
      dispatchLayerState({
        type: 'beginTransition',
        activeIdx: frame.activeIdx,
        incomingIdx: frame.incomingIdx,
      })
      promotionCleanupRef.current = scheduleAfterNextPaint(() => {
        dispatchLayerState({type: 'promotePendingLayer'})
        promotionCleanupRef.current = noCleanup
      })
    }
    prevTransRef.current = frame.transitioning
  }, [frame.activeIdx, frame.incomingIdx, frame.transitioning])

  useEffect(
    () => () => {
      promotionCleanupRef.current()
    },
    [],
  )

  const layers = getPoolMontageRenderLayers(layerState, frame)
  const assetA = assets[layers.aIdx]
  const assetB = assets[layers.bIdx]
  const alternateAssetA = alternateAssets?.[layers.aIdx]
  const alternateAssetB = alternateAssets?.[layers.bIdx]
  const frontPrimaryAsset = layers.front === 'a' ? assetA : assetB
  const frontAlternateAsset = layers.front === 'a' ? alternateAssetA : alternateAssetB
  const frontAsset = showAlternate && frontAlternateAsset ? frontAlternateAsset : frontPrimaryAsset
  const isPaired = presentation === 'paired' && Boolean(frontAlternateAsset)

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
          ...POOL_MONTAGE_TRANSITION_STYLE,
        }}
      >
        <PoolSlotArtworkVisual
          alternateAsset={alternateAssetA}
          asset={assetA}
          loading={loading}
          presentation={presentation}
          showAlternate={showAlternate}
          showFallbackLabel={layers.front === 'a'}
        />
      </div>
      <div
        aria-hidden={layers.front !== 'b'}
        className={POOL_MONTAGE_LAYER_CLASS}
        style={{
          opacity: layers.front === 'b' ? 1 : 0,
          ...POOL_MONTAGE_TRANSITION_STYLE,
        }}
      >
        <PoolSlotArtworkVisual
          alternateAsset={alternateAssetB}
          asset={assetB}
          loading={loading}
          presentation={presentation}
          showAlternate={showAlternate}
          showFallbackLabel={layers.front === 'b'}
        />
      </div>
      <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,14,0.02),rgba(2,6,14,0.04)_48%,rgba(2,6,14,0.74))]' />
      {label ? (
        <div
          className={`pointer-events-none absolute left-1/2 z-20 max-w-[92%] -translate-x-1/2 border border-amber-100/15 bg-slate-950/72 px-1.5 py-1 text-center text-[0.64rem] leading-none font-extrabold tracking-[0.12em] text-amber-50/90 uppercase shadow-sm backdrop-blur-sm ${isPaired ? 'top-[calc(60%-0.4rem)] -translate-y-full' : 'top-2'}`}
        >
          {label}
        </div>
      ) : null}
      {showSeparator ? <SplitPanelSeparator /> : null}
      {isPaired && frontAlternateAsset ? (
        <>
          <SliceDetailTarget
            asset={frontPrimaryAsset}
            className={`${SLICE_DETAIL_TARGET_BASE_CLASS} inset-x-0 top-0 h-[60%]`}
            onOpenDetail={onOpenDetail}
          />
          <SliceDetailTarget
            asset={frontAlternateAsset}
            className={`${SLICE_DETAIL_TARGET_BASE_CLASS} inset-x-0 bottom-0 h-[40%]`}
            onOpenDetail={onOpenDetail}
          />
        </>
      ) : (
        <SliceDetailTarget
          asset={frontAsset}
          className={SLICE_DETAIL_TARGET_CLASS}
          onOpenDetail={onOpenDetail}
        />
      )}
    </div>
  )
}

function PoolSlotArtworkVisual({
  alternateAsset,
  asset,
  loading,
  presentation,
  showAlternate,
  showFallbackLabel,
}: {
  alternateAsset?: SliceAsset
  asset: SliceAsset
  loading: 'eager' | 'lazy'
  presentation: BannerLinkedPresentation
  showAlternate: boolean
  showFallbackLabel: boolean
}) {
  if (!alternateAsset) {
    return <ArtworkVisual asset={asset} loading={loading} showFallbackLabel={showFallbackLabel} />
  }

  if (presentation === 'paired') {
    return (
      <div className='absolute inset-0 grid grid-rows-[3fr_2fr]'>
        <div className='min-h-0 overflow-hidden'>
          <ArtworkVisual asset={asset} loading={loading} showFallbackLabel={showFallbackLabel} />
        </div>
        <div className='min-h-0 overflow-hidden border-t border-slate-950/80'>
          <ArtworkVisual
            asset={alternateAsset}
            loading={loading}
            showFallbackLabel={showFallbackLabel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className='absolute inset-0'>
      <div
        className='absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none'
        style={{opacity: showAlternate ? 0 : 1}}
      >
        <ArtworkVisual asset={asset} loading={loading} showFallbackLabel={showFallbackLabel} />
      </div>
      <div
        className='absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:transition-none'
        style={{opacity: showAlternate ? 1 : 0}}
      >
        <ArtworkVisual
          asset={alternateAsset}
          loading={loading}
          showFallbackLabel={showFallbackLabel}
        />
      </div>
    </div>
  )
}

function PoolMontagePlaceholderSlot({
  asset,
  label,
  showSeparator,
}: {
  asset: SliceAsset
  label?: string
  showSeparator: boolean
}) {
  return (
    <div
      className='group/art-panel relative min-w-0 overflow-hidden bg-slate-950 [contain:paint]'
      title={asset.label}
    >
      <ArtworkFallback label={asset.label} />
      {label ? (
        <div className='pointer-events-none absolute top-2 left-1/2 z-20 max-w-[92%] -translate-x-1/2 border border-amber-100/15 bg-slate-950/72 px-1.5 py-1 text-center text-[0.64rem] leading-none font-extrabold tracking-[0.12em] text-amber-50/90 uppercase shadow-sm backdrop-blur-sm'>
          {label}
        </div>
      ) : null}
      {showSeparator ? <SplitPanelSeparator /> : null}
    </div>
  )
}

function PoolMontageArtwork({
  loading,
  onOpenDetail,
  presentation,
  poolSlots,
  visualSlots,
}: {
  loading: 'eager' | 'lazy'
  onOpenDetail?: (ref: EntityRef) => void
  presentation: BannerLinkedPresentation
  poolSlots: BannerPoolSlot[]
  visualSlots: ResolvedVisualSlot[]
}) {
  const {assetsReady, rootRef} = usePoolMontagePreload(visualSlots)
  const cycleFrames = usePoolCycling(poolSlots, {enabled: assetsReady})
  const hasAlternatingSlots =
    presentation === 'alternating' && visualSlots.some((slot) => slot.alternateAssets)
  const [showAlternate, setShowAlternate] = useState(false)

  useEffect(() => {
    if (
      !assetsReady ||
      !hasAlternatingSlots ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    ) {
      return
    }

    const interval = window.setInterval(() => {
      setShowAlternate((current) => !current)
    }, 4000)

    return () => {
      window.clearInterval(interval)
    }
  }, [assetsReady, hasAlternatingSlots])

  return (
    <div
      className='absolute inset-y-0 left-0 grid bg-slate-950'
      ref={rootRef}
      style={{
        gridTemplateColumns: getPoolGridTemplate(visualSlots.length),
        right: visualSlots.length >= 5 ? '1.75rem' : 0,
      }}
    >
      {assetsReady
        ? visualSlots.map((vs, index) => (
            <PoolMontageSlot
              alternateAssets={vs.alternateAssets}
              assets={vs.assets}
              frame={cycleFrames[vs.cycleFrameIndex]}
              key={getVisualSlotSignature(vs)}
              label={vs.label}
              loading={loading}
              onOpenDetail={onOpenDetail}
              presentation={presentation}
              showSeparator={index < visualSlots.length - 1}
              showAlternate={showAlternate}
            />
          ))
        : visualSlots.map((vs, index) => (
            <PoolMontagePlaceholderSlot
              asset={vs.assets[0]}
              key={getVisualSlotSignature(vs)}
              label={vs.label}
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
  linkedPresentation?: BannerLinkedPresentation
  poolSlots?: BannerPoolSlot[]
  title: string
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerArtwork({
  customArt,
  featured,
  loading = 'lazy',
  linkedPresentation = 'expanded',
  poolSlots,
  title,
  onOpenDetail,
}: BannerArtworkProps) {
  const effectiveFeatured = featured ?? EMPTY_FEATURED
  const displaySlices = useMemo(() => expandFeatured(effectiveFeatured), [effectiveFeatured])
  const displayAssets = useMemo(() => resolveFeaturedAssets(displaySlices), [displaySlices])
  const effectivePoolSlots = poolSlots ?? EMPTY_POOL_SLOTS
  const visualSlots = useMemo(
    () =>
      effectivePoolSlots.length > 0
        ? resolvePoolSlots(effectivePoolSlots, linkedPresentation)
        : null,
    [effectivePoolSlots, linkedPresentation],
  )

  if (customArt) {
    return <FullCardArtwork label={title} loading={loading} url={customArt} />
  }

  if (visualSlots && visualSlots.length > 0) {
    return (
      <PoolMontageArtwork
        loading={loading}
        onOpenDetail={onOpenDetail}
        presentation={linkedPresentation}
        poolSlots={effectivePoolSlots}
        visualSlots={visualSlots}
      />
    )
  }

  return <FeaturedArtwork assets={displayAssets} loading={loading} onOpenDetail={onOpenDetail} />
}
