import {useEffect, useMemo, useRef, useState} from 'react'

import {Link} from 'react-router-dom'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getAwakeners} from '@/domain/awakeners'
import {buildDatabaseAwakenerPath} from '@/domain/database-paths'
import {getRealmIcon, getRealmTint} from '@/domain/factions'
import {
  formatCountdown,
  getTimelineCountdown,
  getTimelineStatus,
  type BannerEntry,
  type BannerFeaturedUnit,
  type BannerPoolSlot,
  type TimelineStatus,
} from '@/domain/timeline'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheels} from '@/domain/wheels'

const BANNER_TYPE_LABEL: Record<BannerEntry['type'], string> = {
  awaken: 'Awaken',
  limited: 'Limited',
  standard: 'Standard',
  rerun: 'Rerun',
  selector: 'Selector',
  wheel: 'Wheel',
  combo: 'Combo',
}

const STATUS_CLASS: Record<TimelineStatus, string> = {
  active: 'border-emerald-400/50 text-emerald-200 bg-emerald-950/60',
  upcoming: 'border-sky-400/50 text-sky-200 bg-sky-950/60',
  ended: 'border-slate-400/40 text-slate-400 bg-slate-900/60',
}

const SKEW_PX = 14
const BORDER_INSET = 1
const CYCLE_INTERVAL_MS = 2500
const TRANSITION_DURATION_MS = 800

function findAwakenerRealm(name: string): string | undefined {
  const needle = name.toLowerCase()
  return getAwakeners().find((a) => a.name.toLowerCase() === needle)?.realm
}

function findSignatureWheel(awakenerName: string) {
  const needle = awakenerName.toLowerCase()
  return getWheels().find((w) => w.awakener.toLowerCase() === needle && w.rarity === 'SSR')
}

function buildClipPath(index: number, total: number): string {
  if (total <= 1) {
    return 'none'
  }

  const s = String(SKEW_PX)
  const b = String(BORDER_INSET)
  const isFirst = index === 0
  const isLast = index === total - 1

  if (isFirst) {
    return `polygon(0 0, calc(100% - ${b}px) 0, calc(100% - ${s}px - ${b}px) 100%, 0 100%)`
  }
  if (isLast) {
    return `polygon(calc(${s}px + ${b}px) 0, 100% 0, 100% 100%, calc(${b}px) 100%)`
  }
  return `polygon(calc(${s}px + ${b}px) 0, calc(100% - ${b}px) 0, calc(100% - ${s}px - ${b}px) 100%, calc(${b}px) 100%)`
}

interface SliceAsset {
  url: string | undefined
  label: string
  linkTo: string | undefined
  realmId: string | undefined
  isWheel: boolean
}

function resolveSliceAsset(unit: BannerFeaturedUnit): SliceAsset {
  if (unit.kind === 'awakener') {
    return {
      url: getAwakenerCardAsset(unit.name),
      label: unit.name,
      linkTo: buildDatabaseAwakenerPath({name: unit.name}),
      realmId: findAwakenerRealm(unit.name),
      isWheel: false,
    }
  }
  if (unit.kind === 'wheel') {
    const needle = unit.name.toLowerCase()
    const wheel = getWheels().find((w) => w.name.toLowerCase() === needle)
    return {
      url: wheel ? getWheelAssetById(wheel.id) : undefined,
      label: unit.name,
      linkTo: undefined,
      realmId: wheel?.realm,
      isWheel: true,
    }
  }
  const wheel = findSignatureWheel(unit.name)
  return {
    url: wheel ? getWheelAssetById(wheel.id) : undefined,
    label: wheel?.name ?? unit.name,
    linkTo: undefined,
    realmId: wheel?.realm ?? findAwakenerRealm(unit.name),
    isWheel: true,
  }
}

interface BannerSliceProps {
  unit: BannerFeaturedUnit
  index: number
  total: number
}

function SliceLabel({asset, total}: {asset: SliceAsset; total: number}) {
  const realmIcon = getRealmIcon(asset.realmId)
  const realmTint = getRealmTint(asset.realmId)

  const fontSize = total >= 4 ? 'text-[10px]' : total >= 3 ? 'text-xs' : 'text-sm'
  const iconSize = total >= 4 ? 'h-5.5 w-5.5' : total >= 3 ? 'h-6 w-6' : 'h-7 w-7'
  const gap = total >= 4 ? 'gap-0.5' : 'gap-1'
  const pb = total <= 2 ? 'pb-2.5' : 'pb-1.5'

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-slate-950 from-15% via-slate-950/75 to-transparent px-1 pt-12 ${pb}`}
    >
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
          style={{color: realmTint}}
        >
          {asset.label}
        </p>
      </div>
    </div>
  )
}

function BannerSlice({unit, index, total}: BannerSliceProps) {
  const asset = resolveSliceAsset(unit)
  const clipPath = buildClipPath(index, total)
  const marginLeft = index === 0 ? 0 : -SKEW_PX

  const imgClass = asset.isWheel
    ? 'h-full w-full object-cover object-center scale-[1.15]'
    : 'h-full w-full object-cover object-top'

  const inner = (
    <>
      {asset.url ? (
        <img alt={asset.label} className={imgClass} draggable={false} src={asset.url} />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-slate-800/80'>
          <span className='sigil-placeholder sigil-placeholder-card' />
        </div>
      )}
      <SliceLabel asset={asset} total={total} />
    </>
  )

  const sharedClassName =
    'relative block h-full shrink-0 overflow-hidden transition-[filter] duration-150 hover:brightness-110 focus-visible:brightness-110'
  const sharedStyle = {flex: '1 1 0', minWidth: 0, clipPath, marginLeft}

  if (asset.linkTo) {
    return (
      <Link className={sharedClassName} style={sharedStyle} title={asset.label} to={asset.linkTo}>
        {inner}
      </Link>
    )
  }

  return (
    <div className={sharedClassName} style={sharedStyle} title={asset.label}>
      {inner}
    </div>
  )
}

interface PoolCycleFrame {
  activeIdx: number
  incomingIdx: number
  transitioning: boolean
}

function getPoolFingerprint(pool: BannerFeaturedUnit[]): string {
  return pool.map((u) => `${u.kind}:${u.name}`).join('|')
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
      assets: slot.pool.map((unit) => resolveSliceAsset(unit)),
      cycleFrameIndex: frameIdx,
    })
    if (slot.linked) {
      visual.push({
        assets: slot.pool.map((unit) => resolveSliceAsset({name: unit.name, kind: 'wheel-auto'})),
        cycleFrameIndex: frameIdx,
      })
    }
  })
  return visual
}

interface PoolBannerSliceProps {
  assets: SliceAsset[]
  frame: PoolCycleFrame
  index: number
  total: number
}

function PoolSliceLayer({asset, total}: {asset: SliceAsset; total: number}) {
  const imgClass = asset.isWheel
    ? 'absolute inset-0 h-full w-full object-cover object-center scale-[1.15]'
    : 'absolute inset-0 h-full w-full object-cover object-top'

  return (
    <>
      {asset.url ? (
        <img alt={asset.label} className={imgClass} draggable={false} src={asset.url} />
      ) : (
        <div className='flex h-full w-full items-center justify-center bg-slate-800/80'>
          <span className='sigil-placeholder sigil-placeholder-card' />
        </div>
      )}
      <SliceLabel asset={asset} total={total} />
    </>
  )
}

function PoolBannerSlice({assets, frame, index, total}: PoolBannerSliceProps) {
  const clipPath = buildClipPath(index, total)
  const marginLeft = index === 0 ? 0 : -SKEW_PX

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
      className={`relative block h-full shrink-0 overflow-hidden ${hasLink ? 'transition-[filter] duration-150 hover:brightness-110' : ''}`}
      style={{flex: '1 1 0', minWidth: 0, clipPath, marginLeft}}
    >
      <div
        className='absolute inset-0 transition-opacity ease-in-out'
        style={{
          opacity: layers.front === 'a' ? 1 : 0,
          transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
        }}
      >
        <PoolSliceLayer asset={assetA} total={total} />
      </div>
      <div
        className='absolute inset-0 transition-opacity ease-in-out'
        style={{
          opacity: layers.front === 'b' ? 1 : 0,
          transitionDuration: `${String(TRANSITION_DURATION_MS)}ms`,
        }}
      >
        <PoolSliceLayer asset={assetB} total={total} />
      </div>
      {frontAsset.linkTo ? (
        <Link className='absolute inset-0 z-20' title={frontAsset.label} to={frontAsset.linkTo} />
      ) : null}
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
  return [featured[0], {name: featured[0].name, kind: 'wheel-auto'}]
}

interface BannerCardProps {
  banner: BannerEntry
  now?: Date
}

export function BannerCard({banner, now}: BannerCardProps) {
  const status = getTimelineStatus(banner.startDate, banner.endDate, now)
  const countdown = getTimelineCountdown(banner.startDate, banner.endDate, now)
  const displaySlices = useMemo(() => expandFeatured(banner.featured ?? []), [banner.featured])
  const visualSlots = useMemo(
    () => (banner.poolSlots ? resolvePoolSlots(banner.poolSlots) : null),
    [banner.poolSlots],
  )
  const cycleFrames = usePoolCycling(banner.poolSlots ?? [])
  const isEnded = status === 'ended'

  return (
    <article
      className={`border bg-slate-900/55 ${isEnded ? 'border-slate-500/30 opacity-65' : 'border-slate-500/45'}`}
    >
      <div className='relative aspect-[8/5] overflow-hidden bg-slate-950/80'>
        <div className='absolute inset-0 flex'>
          {visualSlots && visualSlots.length > 0 ? (
            visualSlots.map((vs, i) => (
              <PoolBannerSlice
                assets={vs.assets}
                frame={cycleFrames[vs.cycleFrameIndex]}
                index={i}
                key={i}
                total={visualSlots.length}
              />
            ))
          ) : displaySlices.length > 0 ? (
            displaySlices.map((unit, index) => (
              <BannerSlice
                index={index}
                key={`${unit.kind}-${unit.name}`}
                total={displaySlices.length}
                unit={unit}
              />
            ))
          ) : (
            <BannerPlaceholderArt />
          )}
        </div>
      </div>

      <div className='flex flex-col gap-1.5 px-3 py-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='min-w-0'>
            <h3 className='ui-title text-sm text-amber-100'>{banner.title}</h3>
            <span className='text-[10px] tracking-wider text-slate-400 uppercase'>
              {BANNER_TYPE_LABEL[banner.type]}
            </span>
          </div>
          <div className='flex shrink-0 flex-col items-end gap-1'>
            <span className={`border px-2 py-0.5 text-[10px] leading-none ${STATUS_CLASS[status]}`}>
              {status === 'active' ? 'Live' : status === 'upcoming' ? 'Soon' : 'Ended'}
            </span>
            {countdown ? (
              <span className='text-[10px] text-slate-300'>{formatCountdown(countdown)}</span>
            ) : null}
          </div>
        </div>
        {banner.description ? (
          <p
            className='text-xs leading-relaxed whitespace-pre-line text-slate-300 [&_a]:text-amber-300 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-amber-200'
            dangerouslySetInnerHTML={{__html: banner.description}}
          />
        ) : null}
      </div>
    </article>
  )
}
