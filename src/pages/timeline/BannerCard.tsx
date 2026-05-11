import {useEffect, useMemo, useRef, useState, type MouseEvent} from 'react'

import {FaChevronRight} from 'react-icons/fa6'
import {Link} from 'react-router-dom'

import type {EntityRef} from '@/domain/entities/types'
import {getRealmAccent, getRealmIcon} from '@/domain/realms'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  type BannerEntry,
  type BannerFeaturedUnit,
  type BannerPoolSlot,
  type TimelineStatus,
} from '@/domain/timeline'

import {resolveTimelineFeaturedAsset, type TimelineFeaturedAsset} from './timelineDetailResolution'

const BANNER_TYPE_LABEL: Record<BannerEntry['type'], string> = {
  awaken: 'New Awakener',
  limited: 'Limited',
  standard: 'Standard',
  rerun: 'Rerun',
  selector: 'Selector',
  wheel: 'Wheel',
  combo: 'Combo',
}

const BANNER_TYPE_COLOR: Record<BannerEntry['type'], string> = {
  awaken: 'text-amber-300/90',
  limited: 'text-sky-300/90',
  standard: 'text-slate-400/80',
  rerun: 'text-violet-300/90',
  selector: 'text-pink-300/90',
  wheel: 'text-cyan-300/90',
  combo: 'text-emerald-300/90',
}

const STATUS_CLASS: Record<TimelineStatus, string> = {
  active: 'timeline-event-chip--status-active',
  upcoming: 'timeline-event-chip--status-upcoming',
  ended: 'timeline-event-chip--status-ended',
}

const CYCLE_INTERVAL_MS = 2500
const TRANSITION_DURATION_MS = 800

type SliceAsset = TimelineFeaturedAsset

interface BannerSliceProps {
  unit: BannerFeaturedUnit
  onOpenDetail?: (ref: EntityRef) => void
}

function getSliceShellStyle(): {flex: string; minWidth: number} {
  return {flex: '1 1 0', minWidth: 0}
}

function SliceLabel({asset, total}: {asset: SliceAsset; total: number}) {
  const realmIcon = getRealmIcon(asset.realmId)
  const realmAccent = getRealmAccent(asset.realmId)

  const fontSize = total >= 4 ? 'text-[10px]' : total >= 3 ? 'text-xs' : 'text-sm'
  const iconSize = total >= 4 ? 'h-5.5 w-5.5' : total >= 3 ? 'h-6 w-6' : 'h-7 w-7'
  const gap = total >= 4 ? 'gap-0.5' : 'gap-1'
  const pb = total <= 2 ? 'pb-2.5' : 'pb-1.5'

  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 px-1 pt-12 ${pb}`}>
      <div className={`flex flex-col items-center ${gap}`}>
        {realmIcon && !asset.isWheel ? (
          <img
            alt=''
            className={`${iconSize} drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}
            draggable={false}
            src={realmIcon}
          />
        ) : null}
        <p
          className={`ui-title text-center ${fontSize} leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,1)]`}
          style={{color: realmAccent}}
        >
          {asset.label}
        </p>
      </div>
    </div>
  )
}

function SliceLabelSlot({asset, total}: {asset: SliceAsset; total: number}) {
  return (
    <div className='relative block h-full shrink-0' style={getSliceShellStyle()}>
      <SliceLabel asset={asset} total={total} />
    </div>
  )
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

function BannerArtSlice({unit, onOpenDetail}: BannerSliceProps) {
  const asset = resolveTimelineFeaturedAsset(unit)

  const imgClass = asset.isWheel
    ? 'h-full w-full object-cover object-center scale-[1.15]'
    : 'h-full w-full object-cover object-top'

  return (
    <div
      className='group/slice relative block h-full shrink-0 overflow-hidden transition-[filter] duration-150 hover:brightness-110 focus-visible:brightness-110'
      style={getSliceShellStyle()}
      title={asset.label}
    >
      <div className='h-full w-full transition-transform duration-300 ease-out group-hover/slice:-translate-y-1 group-hover/slice:scale-[1.03]'>
        {asset.url ? (
          <img alt={asset.label} className={imgClass} draggable={false} src={asset.url} />
        ) : (
          <div className='flex h-full w-full items-center justify-center bg-slate-800/80'>
            <span className='sigil-placeholder sigil-placeholder-card' />
          </div>
        )}
      </div>
      <SliceDetailTarget
        asset={asset}
        className='absolute inset-0 z-30'
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
}

interface PoolCycleFrame {
  activeIdx: number
  incomingIdx: number
  transitioning: boolean
}

function getPoolFingerprint(pool: BannerFeaturedUnit[]): string {
  return pool
    .map((u) => `${u.kind}:${u.name}:${u.detailLink === false ? 'no-detail' : 'detail'}`)
    .join('|')
}

function usePoolCycling(poolSlots: BannerPoolSlot[]): PoolCycleFrame[] {
  const fingerprints = useMemo(() => poolSlots.map((s) => getPoolFingerprint(s.pool)), [poolSlots])

  const sharedGroups = useMemo(() => {
    const groups = new Map<string, number[]>()
    fingerprints.forEach((fp, i) => {
      const existing = groups.get(fp)
      if (existing) {
        existing.push(i)
      } else {
        groups.set(fp, [i])
      }
    })
    return groups
  }, [fingerprints])

  const [frames, setFrames] = useState<PoolCycleFrame[]>(() => {
    const initial: PoolCycleFrame[] = poolSlots.map(() => ({
      activeIdx: 0,
      incomingIdx: -1,
      transitioning: false,
    }))
    for (const group of sharedGroups.values()) {
      if (group.length <= 1) continue
      const poolSize = poolSlots[group[0]].pool.length
      group.forEach((slotIdx, i) => {
        initial[slotIdx].activeIdx = i % poolSize
      })
    }
    return initial
  })

  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const cyclableSlots = poolSlots
      .map((s, i) => (s.pool.length > 1 ? i : -1))
      .filter((i) => i >= 0)
    if (cyclableSlots.length === 0) return

    let deck: number[] = []
    let lastSlot = -1

    function shuffleDeck() {
      deck = [...cyclableSlots]
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[deck[i], deck[j]] = [deck[j], deck[i]]
      }
      if (deck.length > 1 && deck[0] === lastSlot) {
        const swapIdx = 1 + Math.floor(Math.random() * (deck.length - 1))
        ;[deck[0], deck[swapIdx]] = [deck[swapIdx], deck[0]]
      }
    }

    const interval = setInterval(() => {
      if (deck.length === 0) shuffleDeck()
      const slotIdx = deck.shift()
      if (slotIdx === undefined) return
      lastSlot = slotIdx

      setFrames((prev) => {
        if (prev[slotIdx].transitioning) return prev

        const poolSize = poolSlots[slotIdx].pool.length
        const fp = fingerprints[slotIdx]
        const group = sharedGroups.get(fp) ?? [slotIdx]

        const usedIndices = new Set(
          group
            .filter((i) => i !== slotIdx)
            .map((i) => (prev[i].transitioning ? prev[i].incomingIdx : prev[i].activeIdx)),
        )

        let nextIdx = (prev[slotIdx].activeIdx + 1) % poolSize
        let safety = 0
        while (usedIndices.has(nextIdx) && safety < poolSize) {
          nextIdx = (nextIdx + 1) % poolSize
          safety++
        }

        const next = [...prev]
        next[slotIdx] = {...prev[slotIdx], incomingIdx: nextIdx, transitioning: true}
        return next
      })

      if (pendingRef.current) clearTimeout(pendingRef.current)
      pendingRef.current = setTimeout(() => {
        setFrames((prev) =>
          prev.map((f) =>
            f.transitioning ? {activeIdx: f.incomingIdx, incomingIdx: -1, transitioning: false} : f,
          ),
        )
        pendingRef.current = null
      }, TRANSITION_DURATION_MS)
    }, CYCLE_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      if (pendingRef.current) clearTimeout(pendingRef.current)
    }
  }, [poolSlots, fingerprints, sharedGroups])

  return frames
}

interface ResolvedVisualSlot {
  assets: SliceAsset[]
  cycleFrameIndex: number
}

function resolvePoolSlots(poolSlots: BannerPoolSlot[]): ResolvedVisualSlot[] {
  const visual: ResolvedVisualSlot[] = []
  poolSlots.forEach((slot, frameIdx) => {
    visual.push({
      assets: slot.pool.map((unit) => resolveTimelineFeaturedAsset(unit)),
      cycleFrameIndex: frameIdx,
    })
    if (slot.linked) {
      visual.push({
        assets: slot.pool.map((unit) =>
          resolveTimelineFeaturedAsset({
            name: unit.name,
            kind: 'wheel-auto',
            detailLink: unit.detailLink,
          }),
        ),
        cycleFrameIndex: frameIdx,
      })
    }
  })
  return visual
}

interface PoolBannerSliceProps {
  assets: SliceAsset[]
  frame: PoolCycleFrame
  onOpenDetail?: (ref: EntityRef) => void
}

function PoolSliceLayer({asset}: {asset: SliceAsset}) {
  const imgClass = asset.isWheel
    ? 'absolute inset-0 h-full w-full object-cover object-center scale-[1.15]'
    : 'absolute inset-0 h-full w-full object-cover object-top'

  return (
    <div className='absolute inset-0 transition-transform duration-300 ease-out group-hover/slice:-translate-y-1 group-hover/slice:scale-[1.03]'>
      {asset.url ? (
        <img alt={asset.label} className={imgClass} draggable={false} src={asset.url} />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-slate-800/80'>
          <span className='sigil-placeholder sigil-placeholder-card' />
        </div>
      )}
    </div>
  )
}

function PoolBannerSlice({assets, frame, onOpenDetail}: PoolBannerSliceProps) {
  const [layers, setLayers] = useState<{a: number; b: number; front: 'a' | 'b'}>({
    a: frame.activeIdx,
    b: frame.activeIdx,
    front: 'a',
  })
  const prevTransRef = useRef(false)

  useEffect(() => {
    if (frame.transitioning && !prevTransRef.current && frame.incomingIdx >= 0) {
      setLayers((prev) => {
        const back: 'a' | 'b' = prev.front === 'a' ? 'b' : 'a'
        return {...prev, [back]: frame.incomingIdx, front: back}
      })
    }
    prevTransRef.current = frame.transitioning
  }, [frame.transitioning, frame.incomingIdx])

  const assetA = assets[layers.a]
  const assetB = assets[layers.b]
  const frontAsset = layers.front === 'a' ? assetA : assetB
  const hasLink = Boolean(frontAsset.linkTo)

  return (
    <div
      className={`group/slice relative block h-full shrink-0 overflow-hidden ${hasLink ? 'transition-[filter] duration-150 hover:brightness-110' : ''}`}
      style={getSliceShellStyle()}
    >
      <div
        className='absolute inset-0 overflow-hidden transition-opacity ease-in-out'
        style={{
          opacity: layers.front === 'a' ? 1 : 0,
          transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
        }}
      >
        <PoolSliceLayer asset={assetA} />
      </div>
      <div
        className='absolute inset-0 overflow-hidden transition-opacity ease-in-out'
        style={{
          opacity: layers.front === 'b' ? 1 : 0,
          transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
        }}
      >
        <PoolSliceLayer asset={assetB} />
      </div>
      <SliceDetailTarget
        asset={frontAsset}
        className='absolute inset-0 z-20'
        onOpenDetail={onOpenDetail}
      />
    </div>
  )
}

function BannerPlaceholderArt() {
  return (
    <div className='relative flex h-full w-full items-center justify-center bg-slate-800/60'>
      <span className='sigil-placeholder sigil-placeholder-card' />
      <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950/90 to-transparent px-3 pt-6 pb-3'>
        <p className='text-center text-xs text-slate-400'>Select your own rate-up</p>
      </div>
    </div>
  )
}

function expandFeatured(featured: BannerFeaturedUnit[]): BannerFeaturedUnit[] {
  if (featured.length !== 1 || featured[0].kind !== 'awakener') {
    return featured
  }
  return [
    featured[0],
    {name: featured[0].name, kind: 'wheel-auto', detailLink: featured[0].detailLink},
  ]
}

interface BannerCardProps {
  banner: BannerEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

export function BannerCard({banner, now, onOpenDetail}: BannerCardProps) {
  const status = getTimelineStatus(banner.startDate, banner.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(banner.startDate, banner.endDate, now)
  const displaySlices = useMemo(() => expandFeatured(banner.featured ?? []), [banner.featured])
  const displayAssets = useMemo(
    () => displaySlices.map((unit) => resolveTimelineFeaturedAsset(unit)),
    [displaySlices],
  )
  const visualSlots = useMemo(
    () => (banner.poolSlots ? resolvePoolSlots(banner.poolSlots) : null),
    [banner.poolSlots],
  )
  const cycleFrames = usePoolCycling(banner.poolSlots ?? [])
  const isEnded = status === 'ended'
  const hasSliceArt = (visualSlots?.length ?? 0) > 0 || displayAssets.length > 0
  const visualLabelAssets = useMemo(() => {
    if (!visualSlots) return null
    return visualSlots.map((slot) => {
      const frame = cycleFrames[slot.cycleFrameIndex]
      const assetIndex =
        frame.transitioning && frame.incomingIdx >= 0 ? frame.incomingIdx : frame.activeIdx
      return slot.assets[assetIndex] ?? slot.assets[0]
    })
  }, [cycleFrames, visualSlots])
  const showPinned = banner.pinned === true && status === 'active'

  return (
    <article
      className={`group/banner grid min-h-full grid-cols-[8.25rem_minmax(0,1fr)] overflow-hidden rounded-[2px] border shadow-[inset_0_1px_0_rgba(255,244,202,0.035)] transition-[border-color,filter,transform,box-shadow] duration-150 sm:grid-cols-[minmax(12rem,0.54fr)_minmax(0,0.46fr)] ${isEnded ? 'border-slate-700/25 opacity-60 saturate-40' : status === 'upcoming' ? 'border-slate-700/35 opacity-80' : 'border-slate-700/45 hover:border-amber-200/40 hover:brightness-105'} ${showPinned ? 'border-amber-300/45 bg-[linear-gradient(180deg,rgba(37,28,16,0.34),rgba(10,16,28,0.92))] ring-1 ring-amber-300/10 ring-inset' : 'bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(8,13,24,0.94))]'}`}
    >
      <div className='relative min-h-[9.25rem] overflow-hidden border-r border-slate-700/35 bg-slate-950/80 sm:min-h-[11.25rem]'>
        <div className='absolute inset-0 flex'>
          {visualSlots && visualSlots.length > 0 ? (
            visualSlots.map((vs, i) => (
              <PoolBannerSlice
                assets={vs.assets}
                frame={cycleFrames[vs.cycleFrameIndex]}
                key={i}
                onOpenDetail={onOpenDetail}
              />
            ))
          ) : displayAssets.length > 0 ? (
            displaySlices.map((unit) => (
              <BannerArtSlice
                key={`${unit.kind}-${unit.name}`}
                onOpenDetail={onOpenDetail}
                unit={unit}
              />
            ))
          ) : (
            <BannerPlaceholderArt />
          )}
        </div>
        {hasSliceArt ? (
          <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-slate-950 from-15% via-slate-950/60 to-transparent' />
        ) : null}
        {visualLabelAssets && visualLabelAssets.length > 0 ? (
          <div className='pointer-events-none absolute inset-0 z-20 flex'>
            {visualLabelAssets.map((asset, index) => (
              <SliceLabelSlot
                asset={asset}
                key={`${asset.label}-${String(index)}`}
                total={visualLabelAssets.length}
              />
            ))}
          </div>
        ) : displayAssets.length > 0 ? (
          <div className='pointer-events-none absolute inset-0 z-20 flex'>
            {displayAssets.map((asset, index) => (
              <SliceLabelSlot
                asset={asset}
                key={`${asset.label}-${String(index)}`}
                total={displayAssets.length}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={`relative flex min-w-0 flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-3.5 ${isEnded ? 'text-slate-500' : 'text-slate-100'}`}
      >
        <div className='flex items-start justify-between gap-3' title={countdownDisplay?.title}>
          <div className='flex min-w-0 flex-col gap-1'>
            <h3
              className={`ui-title line-clamp-3 min-w-0 text-base leading-tight tracking-tight ${isEnded ? 'text-slate-500' : 'text-amber-50'}`}
            >
              {banner.title}
            </h3>
            <span
              className={`text-[10px] font-bold tracking-[0.12em] uppercase ${isEnded ? 'text-slate-600' : BANNER_TYPE_COLOR[banner.type]}`}
            >
              {BANNER_TYPE_LABEL[banner.type]}
            </span>
          </div>
          <span
            className={`timeline-event-chip timeline-event-chip--status shrink-0 ${STATUS_CLASS[status]}`}
          >
            {status === 'active' ? 'Live' : status === 'upcoming' ? 'Soon' : 'Ended'}
          </span>
        </div>
        {banner.description ? (
          <p
            className='line-clamp-3 text-xs leading-relaxed text-slate-400'
            dangerouslySetInnerHTML={{__html: banner.description}}
          />
        ) : null}
        <div
          className='mt-auto flex items-center justify-between gap-2 pt-1'
          title={countdownDisplay?.title}
        >
          {countdownDisplay ? (
            <span className='text-[11px] font-medium whitespace-nowrap text-slate-400 tabular-nums'>
              {countdownDisplay.text}
            </span>
          ) : (
            <span />
          )}
          <span
            aria-hidden
            className={`grid h-6 w-6 place-items-center border text-[10px] transition-colors ${isEnded ? 'border-slate-700/30 text-slate-600' : 'border-slate-600/50 text-slate-400 group-hover/banner:border-amber-200/40 group-hover/banner:text-amber-100'}`}
          >
            <FaChevronRight />
          </span>
        </div>
      </div>
    </article>
  )
}
