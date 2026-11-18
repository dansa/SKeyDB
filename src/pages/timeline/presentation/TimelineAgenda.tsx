import {FaChevronDown} from 'react-icons/fa6'
import {Link} from 'react-router'

import {formatTimelineDisplayDate} from '@/domain/timeline'

import type {TimelineAgendaGroup, TimelineAgendaMoment} from './timelinePageModel'

const momentTime = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

function getMomentLabel(moment: TimelineAgendaMoment): string {
  if (moment.kind === 'season') return 'D-Zone reset'
  if (moment.action === 'claim') return `Claims close: ${moment.title}`
  return `${moment.title} ${moment.action === 'start' ? 'starts' : 'ends'}`
}

function getAgendaSummary(moments: TimelineAgendaMoment[]): string {
  if (moments.length === 1) return getMomentLabel(moments[0])
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
  const claims = moments.filter((moment) => moment.action === 'claim').length
  if (claims)
    fragments.push(claims === 1 ? '1 claim deadline' : `${String(claims)} claim deadlines`)
  fragments.push(...moments.filter((moment) => moment.kind === 'season').map(() => 'D-Zone reset'))
  return fragments.join(' · ')
}

function relativeTime(date: Date, now: Date): string {
  const hours = Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 3600000))
  return hours < 24 ? `in ${String(hours)}h` : `in ${String(Math.floor(hours / 24))}d`
}

interface AgendaProps {
  groups: TimelineAgendaGroup[]
  now: Date
  onSelect: (id: string) => void
}

function MobileAgenda({groups, now, onSelect}: AgendaProps) {
  const next = groups[0]
  const nextLabel = next.patch?.title ?? getAgendaSummary(next.moments)
  return (
    <details className='group mt-4 border-t border-slate-700/45 md:hidden'>
      <summary className='flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-amber-200/70 [&::-webkit-details-marker]:hidden'>
        <span className='shrink-0 font-semibold text-amber-100'>
          Next: {formatTimelineDisplayDate(next.date.toISOString(), now)}
        </span>
        <span className='min-w-0 flex-1 truncate text-slate-300'>{nextLabel}</span>
        <FaChevronDown
          aria-hidden
          className='size-3 shrink-0 text-slate-400 group-open:rotate-180'
        />
      </summary>
      <ul aria-label='Upcoming dates' className='divide-y divide-slate-700/45'>
        {groups.map(({date, moments, patch}) => (
          <li className='py-2' key={date.toISOString()}>
            <h2 className='text-xs font-semibold text-slate-200'>
              {formatTimelineDisplayDate(date.toISOString(), now)}
            </h2>
            <ul className='pt-1 text-xs'>
              {patch ? (
                <li className='flex min-h-10 flex-wrap items-center justify-between gap-x-3 py-1'>
                  <span className='font-semibold text-amber-100'>{patch.title}</span>
                  <time className='text-slate-400' dateTime={patch.date}>
                    {momentTime.format(new Date(patch.date))}
                  </time>
                </li>
              ) : null}
              {moments.map((moment) => {
                const label = getMomentLabel(moment)
                const row =
                  'flex min-h-10 w-full flex-wrap items-center justify-between gap-x-3 py-1 text-left text-slate-300 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200/70'
                const content = (
                  <>
                    <span>{label}</span>
                    <time className='text-slate-400' dateTime={moment.at}>
                      {momentTime.format(new Date(moment.at))}
                    </time>
                  </>
                )
                return (
                  <li
                    key={`${moment.kind}:${moment.id ?? moment.title}:${moment.action}:${moment.at}`}
                  >
                    {moment.kind === 'season' ? (
                      <Link className={row} to='/d-zone'>
                        {content}
                      </Link>
                    ) : (
                      <button
                        className={row}
                        onClick={() => {
                          if (moment.id) onSelect(moment.id)
                        }}
                        type='button'
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </details>
  )
}

export function TimelineAgenda(props: AgendaProps) {
  if (!props.groups.length) return null
  return (
    <>
      <MobileAgenda {...props} />
      <DesktopAgenda {...props} />
    </>
  )
}

function DesktopAgenda({groups, now, onSelect}: AgendaProps) {
  return (
    <div
      aria-label='Upcoming timeline moments'
      className='timeline-agenda mt-5 hidden pb-1 md:flex'
      role='region'
    >
      <div className='timeline-agenda-node timeline-agenda-now'>
        <span className='text-xs font-semibold text-slate-300'>Now</span>
      </div>
      {groups.slice(0, 4).map((group) => {
        const moment = group.moments.at(0)
        const label = getAgendaSummary(group.moments)
        const {patch} = group
        const content = (
          <>
            <span className='block text-xs font-semibold text-slate-200 tabular-nums'>
              {formatTimelineDisplayDate(group.date.toISOString(), now)}{' '}
              <span className='ml-1 font-normal text-slate-400'>
                {relativeTime(group.date, now)}
              </span>
            </span>
            {patch ? (
              <span className='ui-title mt-1 block truncate text-base leading-tight text-amber-100'>
                {patch.title}
              </span>
            ) : null}
            {label ? (
              <span className='mt-1 block truncate text-xs text-slate-400'>{label}</span>
            ) : null}
          </>
        )
        const className = 'timeline-agenda-node min-w-0 text-left'
        const major = patch ? 'true' : undefined
        if (!moment)
          return (
            <div className={className} data-major={major} key={group.date.toISOString()}>
              {content}
            </div>
          )
        if (!patch && group.moments.length === 1 && moment.kind === 'season')
          return (
            <Link className={className} key={group.date.toISOString()} title={label} to='/d-zone'>
              {content}
            </Link>
          )
        if (!patch && group.moments.length === 1 && moment.id)
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
            data-major={major}
            key={group.date.toISOString()}
            title={[patch?.title, ...group.moments.map(getMomentLabel)].filter(Boolean).join(' · ')}
          >
            {content}
          </div>
        )
      })}
    </div>
  )
}
