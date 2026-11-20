import {useId, useState} from 'react'

import {FaChevronDown} from 'react-icons/fa6'
import {Link} from 'react-router'

import {formatTimelineDisplayDate} from '@/domain/timeline'

import {
  getDesktopAgendaGroups,
  isAgendaSegmentHighlighted,
  type TimelineAgendaGroup,
  type TimelineAgendaMoment,
} from './timelinePageModel'

function getMomentLabel(moment: TimelineAgendaMoment): string {
  if (moment.kind === 'season') return 'D-Zone reset'
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
  fragments.push(...moments.filter((moment) => moment.kind === 'season').map(() => 'D-Zone reset'))
  return fragments.join(' · ')
}

function relativeTime(date: Date, now: Date): string {
  const hours = Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 3600000))
  return hours < 24 ? `in ${String(hours)}h` : `in ${String(Math.floor(hours / 24))}d`
}

function getPatchLabel(patch: NonNullable<TimelineAgendaGroup['patch']>) {
  return patch.action === 'end' ? `${patch.title} ends` : patch.title
}

interface AgendaProps {
  groups: TimelineAgendaGroup[]
  now: Date
  onSelect: (id: string) => void
}

function AgendaMoments({
  group: {moments, patch},
  onSelect,
}: {
  group: TimelineAgendaGroup
  onSelect: AgendaProps['onSelect']
}) {
  const rowClass = 'flex min-h-10 w-full items-center py-1 text-left'
  const actionClass = `${rowClass} text-slate-300 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200/70`
  return (
    <ul className='divide-y divide-slate-700/30 text-xs'>
      {patch ? (
        <li className={rowClass}>
          <time className='font-semibold text-amber-100' dateTime={patch.date}>
            {getPatchLabel(patch)}
          </time>
        </li>
      ) : null}
      {moments.map((moment) => {
        const content = <time dateTime={moment.at}>{getMomentLabel(moment)}</time>
        return (
          <li key={`${moment.kind}:${moment.id ?? moment.title}:${moment.action}:${moment.at}`}>
            {moment.kind === 'season' ? (
              <Link className={actionClass} to='/d-zone'>
                {content}
              </Link>
            ) : (
              <button
                className={actionClass}
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
  )
}

function MobileAgenda({groups, now, onSelect}: AgendaProps) {
  const next = groups[0]
  const nextLabel = next.patch ? getPatchLabel(next.patch) : getAgendaSummary(next.moments)
  return (
    <details className='group mt-4 border-t border-slate-700/45 lg:hidden'>
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
        {groups.map((group) => (
          <li className='py-2' key={group.date.toISOString()}>
            <h2 className='text-xs font-semibold text-slate-200'>
              {formatTimelineDisplayDate(group.date.toISOString(), now)}
            </h2>
            <AgendaMoments group={group} onSelect={onSelect} />
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
  const panelId = useId()
  const [openDate, setOpenDate] = useState<string>()
  const shownGroups = getDesktopAgendaGroups(groups)
  const expandedGroup = shownGroups.find((group) => group.date.toISOString() === openDate)
  return (
    <div aria-label='Upcoming timeline moments' className='mt-5 hidden pb-1 lg:block' role='region'>
      <div className='timeline-agenda flex items-start'>
        <div
          className='timeline-agenda-node timeline-agenda-now'
          data-campaign={isAgendaSegmentHighlighted(now.toISOString(), groups)}
        >
          <span className='text-xs font-semibold text-slate-300'>Now</span>
        </div>
        {shownGroups.map((group) => {
          const moment = group.moments.at(0)
          const label = getAgendaSummary(group.moments)
          const {patch} = group
          const standaloneReset = !patch && group.moments.length === 1 && moment?.kind === 'season'
          const content = (
            <>
              <span className='block text-xs font-semibold text-slate-200 tabular-nums'>
                <time dateTime={group.date.toISOString()}>
                  {formatTimelineDisplayDate(group.date.toISOString(), now)}
                </time>{' '}
                <span className='ml-1 font-normal text-slate-400'>
                  {relativeTime(group.date, now)}
                </span>
              </span>
              {patch ? (
                <span className='ui-title mt-1 block truncate text-base leading-tight text-amber-100'>
                  {getPatchLabel(patch)}
                </span>
              ) : null}
              {label ? (
                <span className='mt-1 block truncate text-xs text-slate-400'>{label}</span>
              ) : null}
            </>
          )
          const className = 'timeline-agenda-node min-w-0 text-left'
          const date = group.date.toISOString()
          const marker = {
            'data-major': patch ? 'true' : undefined,
            'data-campaign': isAgendaSegmentHighlighted(patch?.date ?? date, groups),
          }
          if (!moment)
            return (
              <div className={className} key={date} {...marker}>
                {content}
              </div>
            )
          if (standaloneReset)
            return (
              <Link className={className} key={date} title={label} to='/d-zone' {...marker}>
                {content}
              </Link>
            )
          if (!patch && group.moments.length === 1 && moment.id)
            return (
              <button
                className={className}
                key={date}
                onClick={() => {
                  if (moment.id) onSelect(moment.id)
                }}
                title={label}
                type='button'
                {...marker}
              >
                {content}
              </button>
            )
          const expanded = expandedGroup === group
          return (
            <button
              aria-controls={expanded ? panelId : undefined}
              aria-expanded={expanded}
              className={`${className} cursor-pointer hover:text-amber-100`}
              key={date}
              onClick={() => {
                setOpenDate(expanded ? undefined : date)
              }}
              type='button'
              {...marker}
            >
              <span className='flex items-start justify-between gap-2'>
                <span className='min-w-0'>{content}</span>
                <FaChevronDown
                  aria-hidden
                  className={`mt-0.5 size-3 shrink-0 text-slate-400 ${expanded ? 'rotate-180' : ''}`}
                />
              </span>
            </button>
          )
        })}
      </div>
      {expandedGroup ? (
        <div className='mt-3 border-t border-slate-700/45 pt-1' id={panelId}>
          <AgendaMoments group={expandedGroup} onSelect={onSelect} />
        </div>
      ) : null}
    </div>
  )
}
