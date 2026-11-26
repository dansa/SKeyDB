import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {EntityRef} from '@/domain/entities/types'
import {
  formatTimelineDisplayDate,
  getTimelineStatus,
  type BannerDailyScheduleEntry,
  type BannerEntry,
  type BannerFeaturedUnit,
} from '@/domain/timeline'

import {StageRoster} from './StageRoster'
import {getInitialBannerRotation} from './timelinePageModel'
import {resolveTimelineThumbnail} from './timelineThumbnails'

const dayMs = 86_400_000
const stepClass =
  'ui-compact-control grid min-h-10 cursor-pointer place-items-center disabled:cursor-default disabled:opacity-40'

function SchedulePool({
  title,
  featured,
  offBanner,
  onOpenDetail,
}: {
  title?: string
  featured: BannerFeaturedUnit[]
  offBanner?: BannerFeaturedUnit[]
  onOpenDetail: (ref: EntityRef) => void
}) {
  return (
    <div className='space-y-3'>
      {title ? <h4 className='text-sm font-semibold text-[var(--ui-text-main)]'>{title}</h4> : null}
      <div className='space-y-2'>
        <p className='text-xs font-semibold text-amber-200'>Rate-up</p>
        <StageRoster compact onOpenDetail={onOpenDetail} units={featured} />
      </div>
      {offBanner?.length ? (
        <div className='space-y-2'>
          <p className='text-xs font-semibold text-slate-300'>
            Off-banner SSRs ({offBanner.length})
          </p>
          <StageRoster compact onOpenDetail={onOpenDetail} units={offBanner} />
        </div>
      ) : null}
    </div>
  )
}

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
      {banner.rulesProfile === 'split-daily' ? (
        <div className='space-y-4 divide-y divide-slate-700/40 [&>div:not(:first-child)]:pt-4'>
          {(['awakener', 'wheel'] as const).map((kind) => (
            <SchedulePool
              featured={selected.featured.filter((unit) => unit.kind === kind)}
              key={kind}
              offBanner={selected.offBanner?.filter((unit) => unit.kind === kind)}
              onOpenDetail={onOpenDetail}
              title={kind === 'awakener' ? 'Character Awakening' : 'Wheel Awakening'}
            />
          ))}
        </div>
      ) : (
        <SchedulePool
          featured={selected.featured}
          offBanner={selected.offBanner}
          onOpenDetail={onOpenDetail}
        />
      )}
    </section>
  )
}
