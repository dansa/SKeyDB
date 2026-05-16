import {useRef, useState, type ReactNode} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {
  EVENT_CATEGORY_METADATA,
  getTimelineCountdownDisplay,
  getTimelineStatus,
  type BannerFeaturedUnit,
  type EventCategory,
  type EventEntry,
} from '@/domain/timeline'
import {formatTimelinePrice, type TimelinePriceDisplayMode} from '@/domain/timeline-pricing'

import {EventDescriptionPreview, EventDescriptionShelf} from './EventDescription'
import {resolveTimelineFeaturedAsset} from './timelineDetailResolution'
import {useEventDescriptionOverflow} from './useEventDescriptionOverflow'

type EventMetaTone =
  | 'amber'
  | 'blue'
  | 'champagne'
  | 'gold'
  | 'orange'
  | 'price'
  | 'red'
  | 'slate'
  | 'teal'
  | 'violet'
type EventMetaRole = 'awakener' | 'price' | 'rerun' | 'wheel'

const CATEGORY_TONE: Record<EventCategory, EventMetaTone> = {
  story: 'amber',
  raid: 'red',
  battlepass: 'violet',
  'gameplay-event': 'amber',
  'd-tide': 'red',
  curriculum: 'violet',
  login: 'teal',
  skin: 'violet',
  'wheel-event': 'blue',
  anniversary: 'teal',
  milestone: 'gold',
  preorder: 'orange',
  bundle: 'champagne',
  maintenance: 'slate',
  collab: 'violet',
  other: 'amber',
}

const ROLE_TONE: Record<EventMetaRole, EventMetaTone> = {
  awakener: 'amber',
  price: 'price',
  rerun: 'violet',
  wheel: 'blue',
}

const EVENT_META_LINE_CLASS =
  'flex min-w-0 max-w-full flex-nowrap items-center gap-x-1.5 overflow-hidden leading-none'
const EVENT_META_ITEM_CLASS =
  'inline-flex min-w-0 max-w-[8.75rem] flex-[0_1_auto] items-center gap-1.5 overflow-hidden leading-none'
const EVENT_META_PRIMARY_ITEM_CLASS = 'max-w-none flex-none overflow-visible'
const EVENT_META_SEGMENT_CLASS =
  'timeline-event-meta-segment block h-3.5 min-w-0 max-w-full flex-[1_1_auto] overflow-hidden text-ellipsis whitespace-nowrap align-baseline text-[0.64rem] leading-3.5 font-bold tracking-[0.11em] uppercase'
const EVENT_META_PRIMARY_SEGMENT_CLASS =
  'timeline-event-meta-segment--primary max-w-none flex-none overflow-visible'
const EVENT_META_LINK_CLASS =
  'timeline-event-meta-link cursor-pointer border-0 bg-transparent p-0 text-left shadow-[inset_0_-1px_0_color-mix(in_oklab,currentColor_36%,transparent)] transition-[box-shadow,color] duration-150 hover:shadow-[inset_0_-1px_0_color-mix(in_oklab,currentColor_78%,transparent)] hover:text-amber-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200/35 motion-reduce:transition-none'
const EVENT_ROW_CLASS =
  'group/event-row relative overflow-hidden border bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,16,28,0.88))] transition-colors duration-150 motion-reduce:transition-none'
const EVENT_ROW_ACTIVE_CLASS = 'border-slate-700/40 hover:border-amber-200/30'
const EVENT_ROW_ENDED_CLASS = 'border-slate-700/25'
const EVENT_ART_FRAME_CLASS =
  'relative min-h-[8rem] overflow-hidden border-r border-slate-700/30 bg-slate-950/80'
const EVENT_ART_ENDED_CLASS = 'opacity-[0.55] saturate-50'
const EVENT_ART_LINKED_CLASS =
  'ring-1 ring-inset ring-transparent transition-[filter,box-shadow] duration-150 hover:brightness-110 group-hover/event-row:brightness-110 group-hover/event-row:ring-amber-200/45 motion-reduce:transition-none'

function getEventMetaToneClass(tone: EventMetaTone, isEnded: boolean): string {
  if (isEnded) return 'timeline-event-meta--ended'

  const toneClass: Record<EventMetaTone, string> = {
    amber: 'timeline-event-meta--amber',
    blue: 'timeline-event-meta--blue',
    champagne: 'timeline-event-meta--champagne',
    gold: 'timeline-event-meta--gold',
    orange: 'timeline-event-meta--orange',
    price: 'timeline-event-meta--price',
    red: 'timeline-event-meta--red',
    slate: 'timeline-event-meta--slate',
    teal: 'timeline-event-meta--teal',
    violet: 'timeline-event-meta--violet',
  }

  return toneClass[tone]
}

function getEventTargetTone(kind: EntityRef['kind']): EventMetaTone {
  return kind === 'wheel' ? ROLE_TONE.wheel : ROLE_TONE.awakener
}

interface EventArt {
  url: string | undefined
  isWheel: boolean
  artAlign?: string
  detailTargets: EventDetailTarget[]
}

interface EventDetailTarget {
  label: string
  ref: EntityRef
}

function resolveEventArt(
  featured: BannerFeaturedUnit[] | undefined,
  customArt: string | undefined,
  artAlign?: string,
): EventArt | null {
  const assets = featured?.map((unit) => resolveTimelineFeaturedAsset(unit)) ?? []
  const detailTargets = assets.flatMap((asset) =>
    asset.detailRef ? [{label: asset.label, ref: asset.detailRef}] : [],
  )

  if (customArt) {
    return {url: customArt, isWheel: false, artAlign, detailTargets}
  }

  if (assets.length === 0) {
    return null
  }

  const primaryAsset = assets[0]

  return {
    url: primaryAsset.url,
    isWheel: primaryAsset.isWheel,
    artAlign,
    detailTargets,
  }
}

function EventArtSlice({art, isEnded}: {art: EventArt; isEnded: boolean}) {
  if (!art.url) return null
  const base = art.isWheel ? 'h-full w-full object-cover scale-110' : 'h-full w-full object-cover'
  const posClass = art.artAlign ? '' : art.isWheel ? 'object-center' : 'object-top'
  const posStyle = art.artAlign ? {objectPosition: art.artAlign} : undefined
  const linkedArtClass = art.detailTargets.length > 0 && !isEnded ? EVENT_ART_LINKED_CLASS : ''
  return (
    <div
      className={`relative h-full w-full overflow-hidden ${isEnded ? EVENT_ART_ENDED_CLASS : ''} ${linkedArtClass}`}
    >
      <img
        alt=''
        className={`${base} ${posClass}`}
        decoding='async'
        draggable={false}
        loading='lazy'
        src={art.url}
        style={posStyle}
      />
    </div>
  )
}

function EventMetaSeparator({isEnded}: {isEnded: boolean}) {
  return (
    <span aria-hidden className={isEnded ? 'text-slate-700/70' : 'text-slate-600/75'}>
      &middot;
    </span>
  )
}

function EventMetaText({
  children,
  isEnded,
  primary = false,
  tone,
}: {
  children: string
  isEnded: boolean
  primary?: boolean
  tone: EventMetaTone
}) {
  return (
    <span
      className={`${EVENT_META_SEGMENT_CLASS} ${primary ? EVENT_META_PRIMARY_SEGMENT_CLASS : ''} ${getEventMetaToneClass(tone, isEnded)}`}
      title={children}
    >
      {children}
    </span>
  )
}

function EventDetailTargetText({
  isEnded,
  onOpenDetail,
  target,
}: {
  isEnded: boolean
  onOpenDetail: (ref: EntityRef) => void
  target: EventDetailTarget
}) {
  return (
    <button
      aria-label={`Open details for ${target.label}`}
      className={`${EVENT_META_SEGMENT_CLASS} ${EVENT_META_LINK_CLASS} ${getEventMetaToneClass(getEventTargetTone(target.ref.kind), isEnded)}`}
      onClick={() => {
        onOpenDetail(target.ref)
      }}
      title={target.label}
      type='button'
    >
      {target.label}
    </button>
  )
}

function EventTaxonomyLine({
  category,
  detailTargets,
  isEnded,
  onOpenDetail,
  priceMode,
  pricing,
  preliminary,
  rerun,
}: {
  category: EventCategory
  detailTargets: EventDetailTarget[]
  isEnded: boolean
  onOpenDetail?: (ref: EntityRef) => void
  priceMode: TimelinePriceDisplayMode
  pricing?: string
  preliminary?: boolean
  rerun?: boolean
}) {
  const displayPricing = formatTimelinePrice(pricing, priceMode)
  const meta: {key: string; element: ReactNode; primary?: boolean}[] = [
    {
      key: 'category',
      element: (
        <EventMetaText isEnded={isEnded} primary tone={CATEGORY_TONE[category]}>
          {EVENT_CATEGORY_METADATA[category].label}
        </EventMetaText>
      ),
      primary: true,
    },
  ]

  if (preliminary) {
    meta.push({
      key: 'preliminary',
      element: (
        <EventMetaText isEnded={isEnded} tone='orange'>
          Preliminary
        </EventMetaText>
      ),
    })
  }

  if (rerun) {
    meta.push({
      key: 'rerun',
      element: (
        <EventMetaText isEnded={isEnded} tone={ROLE_TONE.rerun}>
          Rerun
        </EventMetaText>
      ),
    })
  }

  detailTargets.forEach((target) => {
    meta.push({
      key: `${target.ref.kind}-${target.ref.id}`,
      element: onOpenDetail ? (
        <EventDetailTargetText isEnded={isEnded} onOpenDetail={onOpenDetail} target={target} />
      ) : (
        <EventMetaText isEnded={isEnded} tone={getEventTargetTone(target.ref.kind)}>
          {target.label}
        </EventMetaText>
      ),
    })
  })

  if (displayPricing) {
    meta.push({
      key: 'pricing',
      element: (
        <EventMetaText isEnded={isEnded} tone={ROLE_TONE.price}>
          {displayPricing}
        </EventMetaText>
      ),
    })
  }

  return (
    <div className={EVENT_META_LINE_CLASS} aria-label='Event classification'>
      {meta.map((item, index) => (
        <span
          className={`${EVENT_META_ITEM_CLASS} ${item.primary ? EVENT_META_PRIMARY_ITEM_CLASS : ''}`}
          key={item.key}
        >
          {index > 0 ? <EventMetaSeparator isEnded={isEnded} /> : null}
          {item.element}
        </span>
      ))}
    </div>
  )
}

interface EventCardProps {
  event: EventEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
  priceMode?: TimelinePriceDisplayMode
}

export function EventCard({event, now, onOpenDetail, priceMode = 'silver-prime'}: EventCardProps) {
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const descriptionOpenerRef = useRef<HTMLButtonElement | null>(null)
  const status = getTimelineStatus(event.startDate, event.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(event.startDate, event.endDate, now)
  const isEnded = status === 'ended'
  const cat = event.category ?? 'other'
  const description = event.description ?? ''
  const descriptionId = `event-description-${event.id}`
  const {canExpandDescription, descriptionRef} = useEventDescriptionOverflow({description})

  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt = resolveEventArt(
    event.featured,
    hasCustomArt ? event.customArt : undefined,
    event.artAlign,
  )

  return (
    <li
      className={`${EVENT_ROW_CLASS} ${isEnded ? EVENT_ROW_ENDED_CLASS : EVENT_ROW_ACTIVE_CLASS}`}
    >
      <div
        className={`grid h-full ${featuredArt ? 'grid-cols-[5.75rem_minmax(0,1fr)] sm:grid-cols-[6rem_minmax(0,1fr)]' : 'grid-cols-1'}`}
      >
        {featuredArt ? (
          <div className={EVENT_ART_FRAME_CLASS}>
            <div className='absolute inset-0'>
              <EventArtSlice art={featuredArt} isEnded={isEnded} />
            </div>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/60' />
          </div>
        ) : null}
        <div className='relative flex min-w-0 flex-1 flex-col px-3.5 py-3 sm:px-4'>
          <div className='flex min-w-0 flex-col gap-1'>
            <div className='flex min-w-0 items-start justify-between gap-2 sm:gap-3'>
              <div className='min-w-0 flex-1'>
                <h3
                  className={`ui-title line-clamp-2 min-w-0 text-[0.96rem] leading-[1.16] tracking-[0.004em] sm:text-[0.98rem] ${isEnded ? 'text-slate-500' : 'text-amber-50/90'}`}
                >
                  {event.title}
                </h3>
              </div>
              {countdownDisplay ? (
                <span
                  className='max-w-[4.75rem] shrink-0 pt-0.5 text-right text-[11px] leading-tight font-medium text-slate-500 tabular-nums sm:max-w-none sm:whitespace-nowrap'
                  title={countdownDisplay.title}
                >
                  {countdownDisplay.text}
                </span>
              ) : null}
            </div>
            <EventTaxonomyLine
              category={cat}
              detailTargets={featuredArt?.detailTargets ?? []}
              isEnded={isEnded}
              onOpenDetail={onOpenDetail}
              priceMode={priceMode}
              pricing={event.pricing}
              preliminary={event.preliminary}
              rerun={event.rerun}
            />
          </div>
          <EventDescriptionPreview
            canExpandDescription={canExpandDescription}
            description={description}
            descriptionId={descriptionId}
            descriptionOpen={descriptionOpen}
            descriptionRef={descriptionRef}
            onOpenDescription={(opener) => {
              descriptionOpenerRef.current = opener
              setDescriptionOpen(true)
            }}
            priceMode={priceMode}
          />
        </div>
      </div>
      <EventDescriptionShelf
        canExpandDescription={canExpandDescription}
        description={description}
        descriptionId={descriptionId}
        descriptionOpen={descriptionOpen}
        onCloseDescription={() => {
          setDescriptionOpen(false)
          window.requestAnimationFrame(() => {
            descriptionOpenerRef.current?.focus()
          })
        }}
        priceMode={priceMode}
      />
    </li>
  )
}
