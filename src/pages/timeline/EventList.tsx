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
  active: 'border-emerald-400/50 text-emerald-200 bg-emerald-950/60',
  upcoming: 'border-sky-400/50 text-sky-200 bg-sky-950/60',
  ended: 'border-slate-400/40 text-slate-400 bg-slate-900/60',
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
  story: 'border-amber-400/30 text-amber-300/90',
  raid: 'border-red-400/30 text-red-300/90',
  battlepass: 'border-violet-400/30 text-violet-300/90',
  'gameplay-event': 'border-amber-400/30 text-amber-300/90',
  'd-tide': 'border-red-400/30 text-red-300/90',
  curriculum: 'border-violet-400/30 text-violet-300/90',
  login: 'border-teal-400/30 text-teal-300/90',
  skin: 'border-pink-400/30 text-pink-300/90',
  'wheel-event': 'border-cyan-400/30 text-cyan-300/90',
  preorder: 'border-orange-400/30 text-orange-300/90',
  maintenance: 'border-slate-400/30 text-slate-400',
  campaign: 'border-emerald-400/30 text-emerald-300/90',
  collab: 'border-fuchsia-400/30 text-fuchsia-300/90',
  other: 'border-slate-400/30 text-slate-400',
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
  const base = art.isWheel
    ? 'h-full w-full object-cover scale-[1.15]'
    : 'h-full w-full object-cover'
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
  const catTint = CATEGORY_TINT[cat]
  const hasCustomArt = event.customArt && /^https?:\/\/|^\//.test(event.customArt)
  const featuredArt: EventArt | null = hasCustomArt
    ? {url: event.customArt, isWheel: false, artAlign: event.artAlign}
    : event.featured?.[0]
      ? resolveEventArt(event.featured[0], event.artAlign)
      : null

  return (
    <li
      className={`overflow-hidden border bg-slate-900/55 ${isEnded ? 'border-slate-500/25 opacity-55' : 'border-slate-500/40'} ${isPinned && !isEnded ? 'border-l-2 border-l-amber-300/50' : ''}`}
    >
      <div className='flex h-full'>
        <div className='flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2'>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5'>
            {isPinned ? (
              <span className='text-[10px] text-amber-300/80' title='Pinned'>
                &#x1F4CC;
              </span>
            ) : null}
            <h4 className='ui-title min-w-0 text-sm text-amber-100'>{event.title}</h4>
            <div className='ml-auto flex shrink-0 items-center gap-1.5'>
              <span
                className={`border px-2 py-0.5 text-[10px] leading-none ${STATUS_CLASS[status]}`}
              >
                {STATUS_LABEL[status]}
              </span>
              {countdown ? (
                <span className='text-[10px] whitespace-nowrap text-slate-300'>
                  {formatCountdown(countdown)}
                </span>
              ) : null}
            </div>
          </div>
          <div className='flex flex-wrap items-center gap-1.5'>
            <span className={`border px-1.5 py-0.5 text-[9px] tracking-wider uppercase ${catTint}`}>
              {CATEGORY_LABEL[cat]}
            </span>
            {event.pricing ? (
              <span className='border border-[#b8a8a6]/30 bg-[#2a2322]/50 px-1.5 py-0.5 text-[9px] tracking-wider text-[#e5d5d4]'>
                {event.pricing}
              </span>
            ) : null}
          </div>
          {event.description ? (
            <p className='text-xs leading-relaxed whitespace-pre-line text-slate-300'>
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

  return (
    <ul className='grid gap-2 sm:grid-cols-2'>
      {events.map((event) => (
        <EventRow event={event} key={event.id} now={now} />
      ))}
    </ul>
  )
}
