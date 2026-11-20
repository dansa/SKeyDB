import type {CSSProperties, ReactNode} from 'react'

import './season-masthead.css'

export interface SeasonMastheadCountdown {
  text: string
  title?: string
}

export interface SeasonMastheadSummary {
  ariaLabel: string
  kicker: string
  name: ReactNode
  countdown?: SeasonMastheadCountdown | null
  note?: string
  emblemSrc?: string
  artSrc?: string
}

interface SeasonMastheadProps {
  children: ReactNode
  summary: SeasonMastheadSummary
  summaryAlignment?: 'center' | 'default'
}

export function SeasonMasthead({
  children,
  summary,
  summaryAlignment = 'default',
}: SeasonMastheadProps) {
  const summaryStyle = summary.artSrc
    ? ({'--season-masthead-art': `url(${summary.artSrc})`} as CSSProperties)
    : undefined
  const summaryClass = [
    'season-masthead__summary',
    summaryAlignment === 'center' ? 'self-center' : null,
  ]
    .filter(Boolean)
    .join(' ')
  const summaryContent = (
    <>
      <div className='season-masthead__summary-copy'>
        <p className='season-masthead__summary-kicker'>{summary.kicker}</p>
        <p className='season-masthead__summary-name ui-title'>{summary.name}</p>
        <div className='season-masthead__summary-meta'>
          {summary.countdown ? (
            <span className='season-masthead__summary-countdown' title={summary.countdown.title}>
              {summary.countdown.text}
            </span>
          ) : null}
          {summary.note ? (
            <span className='season-masthead__summary-note'>{summary.note}</span>
          ) : null}
        </div>
      </div>
      {summary.emblemSrc ? (
        <div aria-hidden className='season-masthead__summary-emblem'>
          <img
            alt=''
            className='season-masthead__summary-icon'
            decoding='async'
            draggable={false}
            src={summary.emblemSrc}
          />
        </div>
      ) : null}
    </>
  )

  return (
    <header className='season-masthead'>
      <div className='season-masthead__inner'>
        <div className='season-masthead__content'>{children}</div>
        <aside aria-label={summary.ariaLabel} className={summaryClass} style={summaryStyle}>
          {summaryContent}
        </aside>
      </div>
    </header>
  )
}
