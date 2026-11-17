import {Link} from 'react-router'

import type {TimelineAgendaGroup, TimelineAgendaMoment} from './timelineNextModel'

function getAgendaSummary(moments: TimelineAgendaMoment[]): string {
  if (moments.length === 1) {
    const moment = moments[0]
    return `${moment.title}${moment.kind === 'season' ? ' season' : ''} ${moment.action === 'start' ? 'starts' : 'ends'}`
  }
  const fragments: string[] = []
  for (const action of ['end', 'start'] as const) {
    const entries = moments.filter((moment) => moment.kind !== 'season' && moment.action === action)
    const events = entries.filter((moment) => moment.kind === 'event').length
    const banners = entries.filter((moment) => moment.kind === 'banner').length
    const counts = [
      ...(events ? [`${String(events)} event${events === 1 ? '' : 's'}`] : []),
      ...(banners ? [`${String(banners)} banner${banners === 1 ? '' : 's'}`] : []),
    ]
    if (counts.length)
      fragments.push(
        `${counts.join(' · ')} ${action === 'start' ? (entries.length === 1 ? 'starts' : 'start') : entries.length === 1 ? 'ends' : 'end'}`,
      )
  }
  fragments.push(
    ...moments
      .filter((moment) => moment.kind === 'season')
      .map((moment) => `${moment.title} season ends`),
  )
  return fragments.join(' · ')
}

function relativeTime(date: Date, now: Date): string {
  const hours = Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 3600000))
  return hours < 24 ? `in ${String(hours)}h` : `in ${String(Math.floor(hours / 24))}d`
}

export function TimelineAgenda({
  groups,
  now,
  onSelect,
}: {
  groups: TimelineAgendaGroup[]
  now: Date
  onSelect: (id: string) => void
}) {
  if (!groups.length) return null
  return (
    <div
      aria-label='Upcoming timeline moments'
      className='timeline-next-agenda mt-5 hidden pb-1 md:flex'
      role='region'
    >
      <div className='timeline-next-agenda-node timeline-next-agenda-now'>
        <span className='text-xs font-semibold text-slate-300'>Now</span>
      </div>
      {groups.map((group) => {
        const moment = group.moments[0]
        const label = getAgendaSummary(group.moments)
        const content = (
          <>
            <span className='block text-xs font-semibold text-slate-200 tabular-nums'>
              {group.date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}{' '}
              <span className='ml-1 font-normal text-slate-400'>
                {relativeTime(group.date, now)}
              </span>
            </span>
            <span className='mt-1 block truncate text-xs text-slate-400'>{label}</span>
          </>
        )
        const className = 'timeline-next-agenda-node min-w-0 text-left'
        if (group.moments.length === 1 && moment.kind === 'season')
          return (
            <Link className={className} key={group.date.toISOString()} title={label} to='/d-zone'>
              {content}
            </Link>
          )
        if (group.moments.length === 1 && moment.id)
          return (
            <button
              className={className}
              key={group.date.toISOString()}
              onClick={() => {
                if (moment.id) onSelect(moment.id)
              }}
              title={label}
              type='button'
            >
              {content}
            </button>
          )
        return (
          <div
            className={className}
            key={group.date.toISOString()}
            title={group.moments.map((item) => item.title).join(' · ')}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
