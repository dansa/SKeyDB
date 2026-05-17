import type {ReactNode} from 'react'

import type {TimelinePriceDisplayMode} from '@/domain/timeline-pricing'
import type {TimelineContentFilter} from '@/domain/timeline-routing'

const CONTENT_FILTERS: {id: TimelineContentFilter; label: string}[] = [
  {id: 'all', label: 'Both'},
  {id: 'events', label: 'Events'},
  {id: 'banners', label: 'Banners'},
]

const PRICE_DISPLAY_MODES: {
  ariaLabel: string
  id: TimelinePriceDisplayMode
  label: string
  title: string
}[] = [
  {
    ariaLabel: 'Silver Prime',
    id: 'silver-prime',
    label: 'Prime',
    title: 'Show game currency prices',
  },
  {
    ariaLabel: 'Estimated USD',
    id: 'usd-estimate',
    label: 'USD',
    title: 'Show rounded estimated USD prices',
  },
]

interface TimelineContentControlsProps {
  contentFilter: TimelineContentFilter
  onContentFilterChange: (nextFilter: TimelineContentFilter) => void
  onPriceModeChange: (nextMode: TimelinePriceDisplayMode) => void
  priceMode: TimelinePriceDisplayMode
}

export function TimelineContentControls({
  contentFilter,
  onContentFilterChange,
  onPriceModeChange,
  priceMode,
}: TimelineContentControlsProps) {
  return (
    <div className='timeline-v2-control-stack'>
      <div aria-label='Timeline content' className='timeline-v2-filter-list' role='group'>
        {CONTENT_FILTERS.map((filter) => (
          <TimelineFilterButton
            active={contentFilter === filter.id}
            key={filter.id}
            onClick={() => {
              onContentFilterChange(filter.id)
            }}
          >
            {filter.label}
          </TimelineFilterButton>
        ))}
      </div>
      <div className='timeline-v2-price-toggle-shell'>
        <span className='timeline-v2-price-toggle-label'>Display Prices</span>
        <div aria-label='Display prices' className='timeline-v2-price-toggle' role='group'>
          {PRICE_DISPLAY_MODES.map((mode) => (
            <button
              aria-label={mode.ariaLabel}
              aria-pressed={priceMode === mode.id}
              className={`timeline-v2-price-toggle-button ${
                priceMode === mode.id
                  ? 'timeline-v2-price-toggle-button--active'
                  : 'timeline-v2-price-toggle-button--inactive'
              }`}
              key={mode.id}
              onClick={() => {
                onPriceModeChange(mode.id)
              }}
              title={mode.title}
              type='button'
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TimelineFilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  const buttonClass = active
    ? 'timeline-v2-filter-button--active'
    : 'timeline-v2-filter-button--inactive'

  return (
    <button
      aria-pressed={active}
      className={`timeline-v2-filter-button ${buttonClass}`}
      onClick={onClick}
      type='button'
    >
      <span className='timeline-v2-filter-label'>{children}</span>
    </button>
  )
}
