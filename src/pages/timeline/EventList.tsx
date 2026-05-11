import {useState} from 'react'

import type {EntityRef} from '@/domain/entities/types'
import {
  getTimelineCountdownDisplay,
  getTimelineStatus,
  shouldDisplayEndedEventInArchive,
  type BannerFeaturedUnit,
  type EventCategory,
  type EventEntry,
  type TimelineStatus,
} from '@/domain/timeline'

import {TimelineArchiveSection} from './TimelineArchiveSection'
import {resolveTimelineFeaturedAsset} from './timelineDetailResolution'

const STATUS_CLASS: Record<TimelineStatus, string> = {
  active: 'timeline-event-chip--status-active',
  upcoming: 'timeline-event-chip--status-upcoming',
  ended: 'timeline-event-chip--status-ended',
}

const STATUS_LABEL: Record<TimelineStatus, string> = {
  active: 'Live',
  upcoming: 'Soon',
  ended: 'Ended',
}

const CATEGORY_LABEL: Record<EventCategory, string> = {
  story: 'Story',
  raid: 'Raid',
  battlepass: 'Battlepass',
  'gameplay-event': 'Event',
  'd-tide': 'D-Tide',
  curriculum: 'Curriculum',
  login: 'Login',
  skin: 'Skin',
  'wheel-event': 'Wheel',
  preorder: 'Preorder',
  maintenance: 'Maintenance',
  campaign: 'Campaign',
  collab: 'Collab',
  other: 'Event',
}

const CATEGORY_TINT: Record<EventCategory, string> = {
  story: 'timeline-event-chip--amber',
  raid: 'timeline-event-chip--red',
  battlepass: 'timeline-event-chip--violet',
  'gameplay-event': 'timeline-event-chip--amber',
  'd-tide': 'timeline-event-chip--red',
  curriculum: 'timeline-event-chip--violet',
  login: 'timeline-event-chip--teal',
  skin: 'timeline-event-chip--pink',
  'wheel-event': 'timeline-event-chip--cyan',
  preorder: 'timeline-event-chip--orange',
  maintenance: 'timeline-event-chip--slate',
  campaign: 'timeline-event-chip--emerald',
  collab: 'timeline-event-chip--fuchsia',
  other: 'timeline-event-chip--slate',
}

const RERUN_TINT = 'timeline-event-chip--rerun'
const EVENT_META_CHIP_CLASS = 'timeline-event-chip'
const MUTED_CHIP_CLASS = 'timeline-event-chip--muted'
type TimelineEventStatusFilter = 'all' | TimelineStatus

function getEventDetailTargetTint(kind: EntityRef['kind']): string {
  return kind === 'wheel' ? 'timeline-event-chip--wheel' : 'timeline-event-chip--awakener'
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

function EventArtSlice({art}: {art: EventArt}) {
  if (!art.url) return null
  const base = art.isWheel ? 'h-full w-full object-cover scale-110' : 'h-full w-full object-cover'
  const posClass = art.artAlign ? '' : art.isWheel ? 'object-center' : 'object-top'
  const posStyle = art.artAlign ? {objectPosition: art.artAlign} : undefined
  const linkedArtClass =
    art.detailTargets.length > 0
      ? 'ring-1 ring-inset ring-transparent transition-[filter,box-shadow] duration-150 hover:brightness-110 group-hover/event-row:brightness-110 group-hover/event-row:ring-amber-200/45'
      : ''
  return (
    <div className={`relative h-full w-full overflow-hidden ${linkedArtClass}`}>
      <img
        alt=''
        className={`${base} ${posClass}`}
        draggable={false}
        src={art.url}
        style={posStyle}
      />
    </div>
  )
}

function EventDetailTargetChip({
  onOpenDetail,
  target,
}: {
  onOpenDetail: (ref: EntityRef) => void
  target: EventDetailTarget
}) {
  return (
    <button
      aria-label={`Open details for ${target.label}`}
      className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--interactive ${getEventDetailTargetTint(target.ref.kind)}`}
      onClick={() => {
        onOpenDetail(target.ref)
      }}
      title={target.label}
      type='button'
    >
      <span className='timeline-event-chip__label'>{target.label}</span>
    </button>
  )
}

interface EventRowProps {
  event: EventEntry
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
}

function EventRow({event, now, onOpenDetail}: EventRowProps) {
  const status = getTimelineStatus(event.startDate, event.endDate, now)
  const countdownDisplay = getTimelineCountdownDisplay(event.startDate, event.endDate, now)
  const isEnded = status === 'ended'
  const showPinned = event.pinned === true && status === 'active'
  const cat = event.category ?? 'other'
  const catTint = isEnded ? MUTED_CHIP_CLASS : CATEGORY_TINT[cat]

  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt = resolveEventArt(
    event.featured,
    hasCustomArt ? event.customArt : undefined,
    event.artAlign,
  )

  return (
    <li
      className={`group/event-row overflow-hidden border transition-[border-color,filter,transform] duration-150 ${isEnded ? 'border-slate-700/25 opacity-60 saturate-40' : status === 'upcoming' ? 'border-slate-700/35 opacity-80' : 'border-slate-700/40 hover:border-amber-200/30 hover:brightness-105'} ${showPinned ? 'border-amber-300/40 bg-amber-400/[0.03]' : 'bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,16,28,0.88))]'}`}
    >
      <div
        className={`grid h-full ${featuredArt ? 'grid-cols-[6rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)]' : 'grid-cols-1'}`}
      >
        {featuredArt ? (
          <div className='relative min-h-[6.5rem] overflow-hidden border-r border-slate-700/30 bg-slate-950/80 sm:min-h-[7.5rem]'>
            <div className='absolute inset-0'>
              <EventArtSlice art={featuredArt} />
            </div>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950/60' />
          </div>
        ) : null}
        <div className='flex min-w-0 flex-1 flex-col justify-between px-3 py-2.5 sm:px-4 sm:py-3'>
          <div className='flex items-start justify-between gap-3'>
            <div className='flex min-w-0 flex-col gap-1.5'>
              <div className='flex min-w-0 items-center gap-2'>
                <h4
                  className={`min-w-0 truncate text-[14px] leading-tight font-bold tracking-tight sm:text-[15px] ${isEnded ? 'text-slate-500' : 'text-slate-100'}`}
                >
                  {event.title}
                </h4>
              </div>
              <div className='flex flex-wrap items-center gap-1.5'>
                <span className={`${EVENT_META_CHIP_CLASS} ${catTint}`}>{CATEGORY_LABEL[cat]}</span>
                {event.rerun ? (
                  <span
                    className={`${EVENT_META_CHIP_CLASS} ${isEnded ? MUTED_CHIP_CLASS : RERUN_TINT}`}
                  >
                    Rerun
                  </span>
                ) : null}
                {featuredArt && onOpenDetail
                  ? featuredArt.detailTargets.map((target) => (
                      <EventDetailTargetChip
                        key={`${target.ref.kind}-${target.ref.id}`}
                        onOpenDetail={onOpenDetail}
                        target={target}
                      />
                    ))
                  : null}
                {event.pricing ? (
                  <span className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--price`}>
                    {event.pricing}
                  </span>
                ) : null}
              </div>
            </div>
            <div
              className='flex shrink-0 flex-col items-end gap-1 pt-0.5'
              title={countdownDisplay?.title}
            >
              <span
                className={`${EVENT_META_CHIP_CLASS} timeline-event-chip--status ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              {countdownDisplay ? (
                <span className='text-[10px] font-medium whitespace-nowrap text-slate-500 tabular-nums'>
                  {countdownDisplay.text}
                </span>
              ) : null}
            </div>
          </div>
          {event.description ? (
            <p className='mt-2 hidden text-xs leading-relaxed text-balance whitespace-pre-line text-slate-400 sm:line-clamp-2'>
              {event.description}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  )
}

function EventArchiveTeaser({itemCount, onOpen}: {itemCount: number; onOpen: () => void}) {
  return (
    <li className='overflow-hidden border border-slate-600/45 bg-[linear-gradient(120deg,rgba(15,23,42,0.78),rgba(8,14,25,0.9))]'>
      <div className='grid min-h-32 grid-cols-[minmax(0,1fr)_6.5rem]'>
        <div className='flex min-w-0 flex-col justify-center px-4 py-4'>
          <h3 className='ui-title text-base text-amber-50'>View ended events</h3>
          <p className='mt-1 text-xs leading-5 text-slate-400'>Browse past windows and rewards.</p>
          <button
            className='mt-3 inline-flex h-8 w-fit items-center border border-amber-200/45 bg-[linear-gradient(180deg,rgba(141,105,45,0.62),rgba(61,43,22,0.72))] px-3 text-[11px] font-bold text-amber-50 transition-colors hover:border-amber-100/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
            onClick={onOpen}
            type='button'
          >
            View Archive
          </button>
        </div>
        <div className='relative overflow-hidden bg-slate-950/55'>
          <span className='sigil-placeholder sigil-placeholder-card opacity-55' />
          <span className='absolute right-3 bottom-3 text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase'>
            {itemCount} ended
          </span>
        </div>
      </div>
    </li>
  )
}

interface EventListProps {
  events: EventEntry[]
  now?: Date
  onOpenDetail?: (ref: EntityRef) => void
  statusFilter?: TimelineEventStatusFilter
}

export function EventList({events, now, onOpenDetail, statusFilter = 'all'}: EventListProps) {
  const [showEnded, setShowEnded] = useState(false)

  if (events.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  const statusMatches = (status: TimelineStatus) =>
    statusFilter === 'all' || statusFilter === status

  const active = events.filter(
    (e) => getTimelineStatus(e.startDate, e.endDate, now) === 'active' && statusMatches('active'),
  )
  const upcoming = events.filter(
    (e) =>
      getTimelineStatus(e.startDate, e.endDate, now) === 'upcoming' && statusMatches('upcoming'),
  )
  const ended = events.filter(
    (e) =>
      getTimelineStatus(e.startDate, e.endDate, now) === 'ended' &&
      (statusFilter === 'ended' || statusFilter === 'active' || statusFilter === 'all') &&
      shouldDisplayEndedEventInArchive(e),
  )
  const revealEnded = showEnded || statusFilter === 'ended'

  if (active.length === 0 && upcoming.length === 0 && ended.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  return (
    <div className='space-y-5'>
      {active.length > 0 && (
        <ul className='grid gap-3 md:grid-cols-2'>
          {active.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
          {ended.length > 0 && !revealEnded ? (
            <EventArchiveTeaser
              itemCount={ended.length}
              onOpen={() => {
                setShowEnded(true)
              }}
            />
          ) : null}
        </ul>
      )}

      {upcoming.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <h3 className='ui-title text-sm text-slate-400'>Upcoming events</h3>
            <div className='h-px flex-1 bg-gradient-to-r from-amber-200/20 via-slate-500/25 to-transparent' />
          </div>
          <ul className='grid gap-3 md:grid-cols-2'>
            {upcoming.map((event) => (
              <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
            ))}
          </ul>
        </div>
      )}

      {ended.length > 0 ? (
        <TimelineArchiveSection
          contentClassName='grid gap-3 md:grid-cols-2'
          dividerClassName='bg-gradient-to-r from-amber-200/15 via-slate-500/20 to-transparent'
          expanded={revealEnded}
          itemCount={ended.length}
          onToggle={() => {
            setShowEnded((current) => !current)
          }}
          title='Ended events'
          titleClassName='text-slate-400'
        >
          {ended.map((event) => (
            <EventRow event={event} key={event.id} now={now} onOpenDetail={onOpenDetail} />
          ))}
        </TimelineArchiveSection>
      ) : null}
    </div>
  )
}
