import {useState} from 'react'

import {useSearchParams} from 'react-router-dom'

import {getAwakeners} from '@/domain/awakeners'
import type {EntityRef} from '@/domain/entities/types'
import {sortEventsByRelevance} from '@/domain/timeline'
import {timelineBanners, timelineEvents} from '@/domain/timeline-data'
import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import {
  getTimelineViewForSection,
  parseTimelineContentFilter,
  parseTimelineSectionId,
  type TimelineContentFilter,
} from '@/domain/timeline-routing'
import {getWheels} from '@/domain/wheels'
import {DbDetailModalHost} from '@/features/database/detail/DbDetailModalHost'
import {dbDetailStore} from '@/stores/dbDetailStore'
import {SeasonMasthead} from '@/ui/masthead/SeasonMasthead'

import {EventList} from './timeline/EventList'
import {TimelineBannersSection} from './timeline/TimelineBannersSection'
import {TimelineContentControls} from './timeline/TimelineContentControls'
import {getTimelineDZoneSummary} from './timeline/timelineDZoneSummary'
import {TimelinePageSection} from './timeline/TimelinePageSection'

import './timeline/timeline.css'

import {useTimelineNow} from './timeline/useTimelineNow'
import {useTimelineSectionScroll} from './timeline/useTimelineSectionScroll'

function openTimelineDetail(ref: EntityRef) {
  dbDetailStore.getState().openDetail(ref, 'timeline-overlay')
}

export function TimelinePage() {
  const now = useTimelineNow()
  const [searchParams, setSearchParams] = useSearchParams()
  const timelineSection = parseTimelineSectionId(searchParams.get('section'))
  const contentFilter =
    getTimelineViewForSection(timelineSection) ??
    parseTimelineContentFilter(searchParams.get('view'))
  const [priceMode, setPriceMode] = useState<TimelinePriceDisplayMode>('silver-prime')
  const awakeners = getAwakeners()
  const wheels = getWheels()

  const events = sortEventsByRelevance(timelineEvents, now)
  const dZoneSummary = getTimelineDZoneSummary(events, now)
  const showEvents = contentFilter !== 'banners'
  const showBanners = contentFilter !== 'events'

  useTimelineSectionScroll(timelineSection)

  function setContentFilter(nextFilter: TimelineContentFilter) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('section')
    if (nextFilter === 'all') {
      nextParams.delete('view')
    } else {
      nextParams.set('view', nextFilter)
    }
    setSearchParams(nextParams, {replace: true})
  }

  return (
    <section className='timeline-v2 -mt-4 md:-mt-5'>
      <SeasonMasthead
        layout='timeline'
        summary={{
          ariaLabel: 'D-Zone season',
          artSrc: dZoneSummary.artSrc,
          countdown: dZoneSummary.countdown,
          emblemSrc: dZoneSummary.emblemSrc,
          kicker: 'Current Season',
          name: dZoneSummary.name,
          note: dZoneSummary.note,
          to: '/d-zone',
        }}
      >
        <h1 className='sr-only'>Events & Banners</h1>
        <TimelineContentControls
          contentFilter={contentFilter}
          onContentFilterChange={setContentFilter}
          onPriceModeChange={setPriceMode}
          priceMode={priceMode}
        />
      </SeasonMasthead>

      <div className='-my-[0.6rem] space-y-7'>
        {showEvents ? (
          <TimelinePageSection title='Events'>
            <EventList
              events={events}
              now={now}
              onOpenDetail={openTimelineDetail}
              priceMode={priceMode}
              targetSection={timelineSection}
            />
          </TimelinePageSection>
        ) : null}

        {showBanners ? (
          <TimelinePageSection title='Banners'>
            <TimelineBannersSection
              banners={timelineBanners}
              now={now}
              onOpenDetail={openTimelineDetail}
              priceMode={priceMode}
              targetSection={timelineSection}
            />
          </TimelinePageSection>
        ) : null}
      </div>
      <DbDetailModalHost
        awakeners={awakeners}
        callbacks={{
          onClose: () => {
            dbDetailStore.getState().popDetail()
          },
          onSelectAwakener: () => undefined,
          onSelectCovenant: () => undefined,
          onSelectPosse: (posse) => {
            dbDetailStore.getState().pushReferenceDetail({kind: 'posse', id: posse.id})
          },
          onSelectWheel: () => undefined,
          onTabChange: () => undefined,
        }}
        routeItem={null}
        wheels={wheels}
      />
    </section>
  )
}
