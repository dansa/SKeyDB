import {useEffect, useState} from 'react'

import {getTimelineStatus, sortBannersByRelevance, sortEventsByRelevance} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'

import {BannerCard} from './timeline/BannerCard'
import {EventList} from './timeline/EventList'

const TICK_INTERVAL_MS = 60_000

export function TimelinePage() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, TICK_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const banners = sortBannersByRelevance(timelineBanners, now)
  const events = sortEventsByRelevance(timelineEvents, now)

  const activeBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'active',
  )
  const upcomingBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'upcoming',
  )
  const endedBanners = banners.filter(
    (b) => getTimelineStatus(b.startDate, b.endDate, now) === 'ended',
  )

  return (
    <section className='space-y-4'>
      <div className='space-y-3'>
        <h3 className='ui-title text-xl text-amber-100'>Events</h3>
        <EventList events={events} now={now} />
      </div>

      <div className='space-y-3 border-t border-slate-500/30 pt-2'>
        <h3 className='ui-title text-xl text-amber-100'>Banners</h3>

        <div className='space-y-6'>
          {activeBanners.length > 0 && (
            <div className='grid gap-3 sm:grid-cols-2'>
              {activeBanners.map((banner) => (
                <BannerCard banner={banner} key={banner.id} now={now} />
              ))}
            </div>
          )}

          {upcomingBanners.length > 0 && (
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <h4 className='ui-title text-sm text-slate-400'>Upcoming</h4>
                <div className='h-px flex-1 bg-gradient-to-r from-slate-500/30 to-transparent' />
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {upcomingBanners.map((banner) => (
                  <BannerCard banner={banner} key={banner.id} now={now} />
                ))}
              </div>
            </div>
          )}

          {endedBanners.length > 0 && (
            <div className='mt-4 space-y-3'>
              <div className='flex items-center gap-3'>
                <h4 className='ui-title text-sm text-slate-500'>Ended</h4>
                <div className='h-px flex-1 bg-gradient-to-r from-slate-500/20 to-transparent' />
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                {endedBanners.map((banner) => (
                  <BannerCard banner={banner} key={banner.id} now={now} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
