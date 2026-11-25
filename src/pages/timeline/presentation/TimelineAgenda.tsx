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

const AGENDA_LOOKAHEAD_DAYS = 60

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

const AGENDA_ENTRY_CLASS =
  'flex min-h-10 w-full items-center py-1.5 text-left text-sm leading-snug break-words text-slate-200 hover:text-amber-100 hover:underline hover:underline-offset-2 focus-visible:outline-2 focus-visible:outline-amber-200/70 lg:min-h-8'

function AgendaEntryGroup({
  action,
  moments,
  onSelect,
}: {
  action: 'start' | 'end'
  moments: TimelineAgendaMoment[]
  onSelect: AgendaProps['onSelect']
}) {
  const starts = action === 'start'
  return (
    <div className='@container min-w-0'>
      <h3
        className={`mb-2 flex items-baseline gap-2 border-b border-slate-700/45 pb-2 text-sm font-semibold ${starts ? 'text-amber-100' : 'text-slate-200'}`}
      >
        {starts ? 'Starting' : 'Ending'}
        <span className='text-xs font-normal text-slate-400 tabular-nums'>{moments.length}</span>
      </h3>
      <div className='grid gap-x-5 gap-y-3 @min-[320px]:grid-cols-2'>
        {(['event', 'banner'] as const).map((kind) => {
          const entries = moments.filter((moment) => moment.kind === kind)
          if (!entries.length) return null
          return (
            <div className='min-w-0' key={kind}>
              <h4 className='mb-1 text-xs font-semibold text-slate-400'>
                {kind === 'event' ? 'Events' : 'Banners'}
              </h4>
              <ul aria-label={`${starts ? 'Starting' : 'Ending'} ${kind}s`}>
                {entries.map((moment) => (
                  <li key={`${moment.id ?? moment.title}:${moment.at}`}>
                    <button
                      aria-label={getMomentLabel(moment)}
                      className={AGENDA_ENTRY_CLASS}
                      onClick={() => {
                        if (moment.id) onSelect(moment.id)
                      }}
                      type='button'
                    >
                      <span className='min-w-0'>{moment.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AgendaMoments({
  group,
  onSelect,
}: {
  group: TimelineAgendaGroup
  onSelect: AgendaProps['onSelect']
}) {
  const {moments, patch} = group
  const starting = moments.filter(({action, kind}) => action === 'start' && kind !== 'season')
  const ending = moments.filter(({action}) => action === 'end')
  const reset = moments.find(({kind}) => kind === 'season')
  const sections = (
    [
      {action: 'start', entries: starting},
      {action: 'end', entries: ending},
    ] as const
  ).filter(({entries}) => entries.length > 0)
  const hasEntries = sections.length > 0
  return (
    <>
      {patch?.launchNote ? (
        <p className={`text-sm text-slate-300 ${moments.length ? 'mb-3' : ''}`}>
          {patch.launchNote}
        </p>
      ) : null}
      {hasEntries ? (
        <div className={`grid gap-x-8 gap-y-5 ${sections.length === 2 ? 'lg:grid-cols-2' : ''}`}>
          {sections.map(({action, entries}) => (
            <AgendaEntryGroup action={action} key={action} moments={entries} onSelect={onSelect} />
          ))}
        </div>
      ) : null}
      {reset ? (
        <div className={hasEntries ? 'mt-3 border-t border-slate-700/45' : ''}>
          <Link className={`${AGENDA_ENTRY_CLASS} max-w-max`} to='/d-zone'>
            <time dateTime={reset.at}>D-Zone reset</time>
          </Link>
        </div>
      ) : null}
    </>
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
          <li className='py-3' key={group.date.toISOString()}>
            <h2 className='mb-3 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-slate-200'>
              <time dateTime={group.date.toISOString()}>
                {formatTimelineDisplayDate(group.date.toISOString(), now)}
              </time>
              {group.patch ? (
                <span className='text-amber-100'>{getPatchLabel(group.patch)}</span>
              ) : null}
            </h2>
            <AgendaMoments group={group} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </details>
  )
}

export function TimelineAgenda(props: AgendaProps) {
  const {now} = props
  const boundary = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + AGENDA_LOOKAHEAD_DAYS + 1,
  )
  const visibleGroups = props.groups.filter((group) => group.date < boundary)
  if (!visibleGroups.length) return null
  return (
    <>
      <MobileAgenda {...props} groups={visibleGroups} />
      <DesktopAgenda {...props} visibleGroups={visibleGroups} />
    </>
  )
}

function DesktopAgenda({
  groups,
  now,
  onSelect,
  visibleGroups,
}: AgendaProps & {visibleGroups: TimelineAgendaGroup[]}) {
  const panelId = useId()
  const [openDate, setOpenDate] = useState<string>()
  const shownGroups = getDesktopAgendaGroups(visibleGroups)
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
          const singleEntryId = !patch && group.moments.length === 1 ? moment?.id : undefined
          const expandable = Boolean(
            (moment ?? patch?.launchNote) && !standaloneReset && !singleEntryId,
          )
          const expanded = expandedGroup === group
          const content = (
            <>
              <span className='flex flex-wrap items-center gap-x-1.5 text-xs font-semibold text-slate-200 tabular-nums'>
                <time dateTime={group.date.toISOString()}>
                  {formatTimelineDisplayDate(group.date.toISOString(), now)}
                </time>
                {expandable ? (
                  <FaChevronDown
                    aria-hidden
                    className={`size-3 shrink-0 text-slate-400 ${expanded ? 'rotate-180' : ''}`}
                  />
                ) : null}
                <span className='font-normal text-slate-400'>{relativeTime(group.date, now)}</span>
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
          if (!moment && !expandable)
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
          if (singleEntryId)
            return (
              <button
                className={className}
                key={date}
                onClick={() => {
                  setOpenDate(undefined)
                  onSelect(singleEntryId)
                }}
                title={label}
                type='button'
                {...marker}
              >
                {content}
              </button>
            )
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
              {content}
            </button>
          )
        })}
      </div>
      {expandedGroup ? (
        <div className='mt-4 border-t border-slate-700/45 pt-4' id={panelId}>
          <h2 className='sr-only'>
            {formatTimelineDisplayDate(expandedGroup.date.toISOString(), now)}
          </h2>
          <AgendaMoments group={expandedGroup} onSelect={onSelect} />
        </div>
      ) : null}
    </div>
  )
}
