import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {
  formatCountdown,
  getTimelineCountdown,
  getTimelineStatus,
  type BannerFeaturedUnit,
  type EventCategory,
  type EventEntry,
  type TimelineStatus,
} from '@/domain/timeline'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheels} from '@/domain/wheels'

const STATUS_CLASS: Record<TimelineStatus, string> = {
  active: 'border-emerald-500 bg-slate-950 text-emerald-400',
  upcoming: 'border-sky-500 bg-slate-950 text-sky-400',
  ended: 'border-slate-500/40 bg-slate-900/60 text-slate-500',
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
  story: 'border-amber-500/30 bg-slate-950/40 text-amber-500/80',
  raid: 'border-red-500/30 bg-slate-950/40 text-red-500/80',
  battlepass: 'border-violet-500/30 bg-slate-950/40 text-violet-500/80',
  'gameplay-event': 'border-amber-500/30 bg-slate-950/40 text-amber-500/80',
  'd-tide': 'border-red-500/30 bg-slate-950/40 text-red-500/80',
  curriculum: 'border-violet-500/30 bg-slate-950/40 text-violet-500/80',
  login: 'border-teal-500/30 bg-slate-950/40 text-teal-500/80',
  skin: 'border-pink-500/30 bg-slate-950/40 text-pink-500/80',
  'wheel-event': 'border-cyan-500/30 bg-slate-950/40 text-cyan-500/80',
  preorder: 'border-orange-500/30 bg-slate-950/40 text-orange-500/80',
  maintenance: 'border-slate-500/30 bg-slate-950/40 text-slate-500/80',
  campaign: 'border-emerald-500/30 bg-slate-950/40 text-emerald-500/80',
  collab: 'border-fuchsia-500/30 bg-slate-950/40 text-fuchsia-500/80',
  other: 'border-slate-500/30 bg-slate-950/40 text-slate-500/80',
}

const CATEGORY_BORDER_LEFT: Record<EventCategory, string> = {
  story: 'border-l-amber-400',
  raid: 'border-l-red-400',
  battlepass: 'border-l-violet-400',
  'gameplay-event': 'border-l-amber-400',
  'd-tide': 'border-l-red-400',
  curriculum: 'border-l-violet-400',
  login: 'border-l-teal-400',
  skin: 'border-l-pink-400',
  'wheel-event': 'border-l-cyan-400',
  preorder: 'border-l-orange-400',
  maintenance: 'border-l-slate-400',
  campaign: 'border-l-emerald-400',
  collab: 'border-l-fuchsia-400',
  other: 'border-l-slate-400',
}

interface EventArt {
  url: string | undefined
  isWheel: boolean
  artAlign?: string
}

function resolveEventArt(unit: BannerFeaturedUnit, artAlign?: string): EventArt {
  if (unit.kind === 'awakener') {
    return {url: getAwakenerCardAsset(unit.name), isWheel: false, artAlign}
  }
  const needle = unit.name.toLowerCase()
  const wheel = getWheels().find((w) => w.name.toLowerCase() === needle)
  return {url: wheel ? getWheelAssetById(wheel.id) : undefined, isWheel: true, artAlign}
}

function EventArtSlice({art}: {art: EventArt}) {
  if (!art.url) return null
  const base = art.isWheel ? 'h-full w-full object-cover scale-110' : 'h-full w-full object-cover'
  const posClass = art.artAlign ? '' : art.isWheel ? 'object-center' : 'object-top'
  const posStyle = art.artAlign ? {objectPosition: art.artAlign} : undefined
  return (
    <div className='h-full w-full overflow-hidden'>
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

interface EventRowProps {
  event: EventEntry
  now?: Date
}

function EventRow({event, now}: EventRowProps) {
  const status = getTimelineStatus(event.startDate, event.endDate, now)
  const countdown = getTimelineCountdown(event.startDate, event.endDate, now)
  const isEnded = status === 'ended'
  const isPinned = event.pinned === true
  const cat = event.category ?? 'other'
  const catTint = isEnded
    ? 'border-slate-500/20 border-l-slate-600 bg-slate-600/10 text-slate-400'
    : CATEGORY_TINT[cat]
  const wrapperBorderLeft = isEnded ? 'border-l-slate-700' : CATEGORY_BORDER_LEFT[cat]

  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt: EventArt | null = hasCustomArt
    ? {url: event.customArt, isWheel: false, artAlign: event.artAlign}
    : event.featured?.[0]
      ? resolveEventArt(event.featured[0], event.artAlign)
      : null

  return (
    <li
      className={`overflow-hidden border bg-slate-900/55 ${isEnded ? 'border-slate-500/25 opacity-60 saturate-50' : status === 'upcoming' ? 'border-slate-500/40 opacity-70' : 'border-slate-500/40'} ${isPinned && !isEnded ? '!border-l-amber-400 bg-amber-400/5 ring-1 ring-amber-400/10 ring-inset' : wrapperBorderLeft}`}
    >
      <div className='flex h-full'>
        <div className='flex min-w-0 flex-1 flex-col py-3 pl-5'>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-0'>
            {isPinned ? (
              <span className='text-[10px] text-amber-300/80 drop-shadow-sm' title='Pinned'>
                &#x1F4CC;
              </span>
            ) : null}
            <h4
              className={`ui-title min-w-0 text-base font-bold tracking-tight drop-shadow-sm ${isEnded ? 'text-slate-400' : 'text-slate-100'}`}
            >
              {event.title}
            </h4>
            <div className='ml-auto flex shrink-0 flex-col items-end justify-center gap-0.5'>
              <span
                className={`rounded-[2px] border px-1.5 py-0.5 text-[9px] font-medium tracking-wider ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              {countdown ? (
                <span className='text-[10px] font-medium whitespace-nowrap text-slate-400 drop-shadow-sm'>
                  {formatCountdown(countdown)}
                </span>
              ) : null}
            </div>
          </div>
          <div className='mt-0.5 flex flex-wrap items-center gap-1.5'>
            <span
              className={`rounded-[2px] border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${catTint}`}
            >
              {CATEGORY_LABEL[cat]}
            </span>
            {event.pricing ? (
              <span className='rounded-[2px] border border-slate-600/50 bg-gradient-to-br from-slate-700/40 via-slate-800/40 to-slate-900/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-slate-200 shadow-inner'>
                {event.pricing}
              </span>
            ) : null}
          </div>
          {event.description ? (
            <p className='mt-2.5 line-clamp-3 text-xs leading-relaxed text-balance whitespace-pre-line text-slate-400 drop-shadow-sm'>
              {event.description}
            </p>
          ) : null}
        </div>
        {featuredArt ? (
          <div
            className='relative w-16 shrink-0 bg-slate-950/80'
            style={{clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%)'}}
          >
            <div className='absolute inset-0'>
              <EventArtSlice art={featuredArt} />
            </div>
          </div>
        ) : null}
      </div>
    </li>
  )
}

interface EventListProps {
  events: EventEntry[]
  now?: Date
}

export function EventList({events, now}: EventListProps) {
  if (events.length === 0) {
    return <p className='px-3 py-4 text-sm text-slate-400'>No events to display.</p>
  }

  const active = events.filter((e) => getTimelineStatus(e.startDate, e.endDate, now) === 'active')
  const upcoming = events.filter(
    (e) => getTimelineStatus(e.startDate, e.endDate, now) === 'upcoming',
  )
  const ended = events.filter((e) => getTimelineStatus(e.startDate, e.endDate, now) === 'ended')

  return (
    <div className='space-y-6'>
      {active.length > 0 && (
        <ul className='grid gap-2 sm:grid-cols-2'>
          {active.map((event) => (
            <EventRow event={event} key={event.id} now={now} />
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center gap-3'>
            <h4 className='ui-title text-sm text-slate-400'>Upcoming</h4>
            <div className='h-px flex-1 bg-gradient-to-r from-slate-500/30 to-transparent' />
          </div>
          <ul className='grid gap-2 sm:grid-cols-2'>
            {upcoming.map((event) => (
              <EventRow event={event} key={event.id} now={now} />
            ))}
          </ul>
        </div>
      )}

      {ended.length > 0 && (
        <div className='mt-4 space-y-3'>
          <div className='flex items-center gap-3'>
            <h4 className='ui-title text-sm text-slate-500'>Ended</h4>
            <div className='h-px flex-1 bg-gradient-to-r from-slate-700/20 to-transparent' />
          </div>
          <ul className='grid gap-2 sm:grid-cols-2'>
            {ended.map((event) => (
              <EventRow event={event} key={event.id} now={now} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
