import {useState} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {EntityRef} from '@/domain/entities/types'
import {getBannerDailyScheduleEntry, getTimelineStatus, type BannerEntry} from '@/domain/timeline'

import {StageRoster} from './StageRoster'
import {resolveTimelineThumbnail} from './timelineNextThumbnails'

const dayMs = 86_400_000

export function StageSchedule({
  banner,
  now,
  onOpenDetail,
}: {
  banner: BannerEntry
  now: Date
  onOpenDetail: (ref: EntityRef) => void
}) {
  const schedule = banner.dailySchedule ?? []
  const [pickedDay, setPickedDay] = useState<number>()
  const activeDay =
    getTimelineStatus(banner.startDate, banner.endDate, now) === 'active'
      ? getBannerDailyScheduleEntry(banner, now)?.day
      : undefined
  const selected = schedule.find(({day}) => day === (pickedDay ?? activeDay)) ?? schedule.at(0)
  if (!selected) return null
  const start = new Date(banner.startDate).getTime()
  return (
    <section className='space-y-3 border-t border-slate-700/40 pt-4'>
      <h3 className='text-[0.65rem] font-extrabold text-slate-400 uppercase'>Schedule</h3>
      <div className='grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-stretch gap-2'>
        <button
          aria-label='Previous day'
          className='grid min-h-10 cursor-pointer place-items-center border border-slate-700/60 text-slate-200 disabled:cursor-default disabled:opacity-40'
          disabled={selected.day === schedule[0].day}
          onClick={() => {
            setPickedDay(selected.day - 1)
          }}
          type='button'
        >
          <FaChevronLeft aria-hidden className='size-3' />
        </button>
        <select
          aria-label='Rotation day'
          className='min-w-0 border border-slate-700/60 bg-slate-950 px-2 text-xs text-slate-200'
          value={selected.day}
          onChange={(event) => {
            setPickedDay(Number(event.target.value))
          }}
        >
          {schedule.map(({day, featured}) => {
            const date = new Date(start + (day - 1) * dayMs)
            const lead = featured[0] ? resolveTimelineThumbnail(featured[0]).asset.label : undefined
            const label = date.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
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
          className='grid min-h-10 cursor-pointer place-items-center border border-slate-700/60 text-slate-200 disabled:cursor-default disabled:opacity-40'
          disabled={selected.day === schedule.at(-1)?.day}
          onClick={() => {
            setPickedDay(selected.day + 1)
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
