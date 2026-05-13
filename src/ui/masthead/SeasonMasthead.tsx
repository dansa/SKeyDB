import type {CSSProperties, ReactNode} from 'react'

import {Link} from 'react-router-dom'

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
  emblemSrc: string
  artSrc?: string
  linkAriaLabel?: string
  to?: string
}

interface SeasonMastheadProps {
  children: ReactNode
  layout: 'page' | 'timeline'
  summary: SeasonMastheadSummary
  summaryAlignment?: 'center' | 'default'
}

export function SeasonMasthead({
  children,
  layout,
  summary,
  summaryAlignment = 'default',
}: SeasonMastheadProps) {
  const summaryStyle = summary.artSrc
    ? ({'--season-masthead-art': `url(${summary.artSrc})`} as CSSProperties)
    : undefined
  const summaryClass = [
    'season-masthead__summary',
    summary.to ? 'season-masthead__summary--link' : null,
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
        </div>
      </div>
      <div aria-hidden className='season-masthead__summary-emblem'>
        <img
          alt=''
          className='season-masthead__summary-icon'
          decoding='async'
          draggable={false}
          src={summary.emblemSrc}
        />
      </div>
    </>
  )

  return (
    <header className={`season-masthead season-masthead--${layout}`}>
      <div className='season-masthead__inner'>
        <div className='season-masthead__content'>{children}</div>
        {summary.to ? (
          <Link
            aria-label={summary.linkAriaLabel ?? summary.ariaLabel}
            className={summaryClass}
            style={summaryStyle}
            to={summary.to}
          >
            {summaryContent}
          </Link>
        ) : (
          <aside aria-label={summary.ariaLabel} className={summaryClass} style={summaryStyle}>
            {summaryContent}
          </aside>
        )}
      </div>
    </header>
  )
}
