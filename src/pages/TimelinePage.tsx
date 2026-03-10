import {useEffect, useState} from 'react'

import {sortBannersByRelevance, sortEventsByRelevance} from '@/domain/timeline'
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

  return (
    <section className='space-y-4'>
      <div className='space-y-3'>
        <h3 className='ui-title text-base text-amber-100'>Events</h3>
        <EventList events={events} now={now} />
      </div>

      <div className='space-y-3'>
        <h3 className='ui-title text-base text-amber-100'>Banners</h3>
        <div className='grid gap-3 sm:grid-cols-2'>
          {banners.map((banner) => (
            <BannerCard banner={banner} key={banner.id} now={now} />
          ))}
        </div>
      </div>
    </section>
  )
}
