import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {EntityRef} from '@/domain/entities/types'
import {
  formatTimelineDisplayDate,
  getTimelineStatus,
  type BannerDailyScheduleEntry,
  type BannerEntry,
} from '@/domain/timeline'

import {StageRoster} from './StageRoster'
import {getInitialBannerRotation} from './timelineNextModel'
import {resolveTimelineThumbnail} from './timelineNextThumbnails'

const dayMs = 86_400_000
const stepClass =
  'ui-compact-control grid min-h-10 cursor-pointer place-items-center disabled:cursor-default disabled:opacity-40'

export function StageSchedule({
  banner,
  now,
  onOpenDetail,
  onSelectDay,
  selected,
}: {
  banner: BannerEntry
  now: Date
  onOpenDetail: (ref: EntityRef) => void
  onSelectDay: (day: number) => void
  selected: BannerDailyScheduleEntry
}) {
  const schedule = banner.dailySchedule ?? []
  if (!schedule.length) return null
  const activeDay =
    getTimelineStatus(banner.startDate, banner.endDate, now) === 'active'
      ? getInitialBannerRotation(banner, now)?.day
      : undefined
  const start = new Date(banner.startDate).getTime()
  return (
    <section className='space-y-3 border-t border-slate-700/40 pt-4'>
      <h3 className='text-[0.65rem] font-extrabold tracking-[0.12em] text-slate-400 uppercase'>
        Schedule
      </h3>
      <div className='grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-stretch gap-2'>
        <button
          aria-label='Previous day'
          className={stepClass}
          disabled={selected.day === schedule[0].day}
          onClick={() => {
            onSelectDay(selected.day - 1)
          }}
          type='button'
        >
          <FaChevronLeft aria-hidden className='size-3' />
        </button>
        <select
          aria-label='Rotation day'
          className='ui-compact-control ui-compact-control--field min-w-0 text-xs'
          value={selected.day}
          onChange={(event) => {
            onSelectDay(Number(event.target.value))
          }}
        >
          {schedule.map(({day, featured}) => {
            const date = new Date(start + (day - 1) * dayMs)
            const lead = featured[0] ? resolveTimelineThumbnail(featured[0]).asset.label : undefined
            const label = formatTimelineDisplayDate(date.toISOString(), now)
            return (
              <option key={day} value={day}>
                Day {day} · {label}
                {lead ? ` · ${lead}` : ''}
                {day === activeDay ? ' (Today)' : ''}
              </option>
            )
          })}
        </select>
        <button
          aria-label='Next day'
          className={stepClass}
          disabled={selected.day === schedule.at(-1)?.day}
          onClick={() => {
            onSelectDay(selected.day + 1)
          }}
          type='button'
        >
          <FaChevronRight aria-hidden className='size-3' />
        </button>
      </div>
      <div className='space-y-2'>
        <h4 className='text-xs font-semibold text-amber-200'>Rate-up</h4>
        <StageRoster compact onOpenDetail={onOpenDetail} units={selected.featured} />
      </div>
      {selected.offBanner?.length ? (
        <div className='space-y-2'>
          <h4 className='text-xs font-semibold text-slate-300'>
            Off-banner SSRs ({selected.offBanner.length})
          </h4>
          <StageRoster compact onOpenDetail={onOpenDetail} units={selected.offBanner} />
        </div>
      ) : null}
    </section>
  )
}
