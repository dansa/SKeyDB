import {useId, type CSSProperties, type ReactNode} from 'react'

import {useHybridDatabaseCardMode} from './hybrid-database-card-mode'

interface DatabaseGridCardFrameProps {
  actionLabel?: string
  content: {
    detail?: ReactNode
    dossierTitleAddon?: ReactNode
    meta?: ReactNode
    title: ReactNode
  }
  layout?: 'hybrid' | 'portrait' | 'square-art'
  media: {
    alt: string
    dossierClassName?: string
    dossierSrc?: string | undefined
    posterAspectClassName?: string
    posterBadge?: {
      label?: string | undefined
      src?: string | undefined
    }
    posterClassName?: string
    posterSrc: string | undefined
    prioritize: boolean
  }
  onSelect: () => void
  realmAccent: string
}

function NoImage({className}: {className?: string}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center text-[10px] tracking-wide text-slate-500 uppercase ${className ?? ''}`}
    >
      No Image
    </div>
  )
}

function PendingImage({className}: {className?: string}) {
  return (
    <div
      aria-hidden='true'
      className={`h-full w-full bg-[color-mix(in_oklab,var(--realm-accent)_5%,rgb(8_15_27))] ${className ?? ''}`}
    />
  )
}

function CardImage({
  alt,
  className,
  decorative = false,
  prioritize,
  src,
}: {
  alt: string
  className: string
  decorative?: boolean
  prioritize: boolean
  src: string | undefined
}) {
  if (!src) {
    return <NoImage className={className} />
  }

  return (
    <div className='database-grid-card__image-plane absolute inset-0'>
      <img
        alt={decorative ? '' : alt}
        aria-hidden={decorative ? 'true' : undefined}
        className={className}
        decoding='async'
        draggable={false}
        fetchPriority={prioritize ? 'high' : 'low'}
        loading={prioritize ? 'eager' : 'lazy'}
        src={src}
      />
    </div>
  )
}

function PosterBadge({label, src}: {label: string | undefined; src: string | undefined}) {
  if (!src) {
    return null
  }

  return (
    <img
      alt=''
      aria-hidden='true'
      className='database-grid-card__poster-badge absolute top-0 left-0 z-10 h-12 w-12 object-contain'
      draggable={false}
      src={src}
      title={label}
    />
  )
}

export function DatabaseGridCardFrame({
  actionLabel = 'View details for',
  content,
  layout = 'hybrid',
  media,
  onSelect,
  realmAccent,
}: DatabaseGridCardFrameProps) {
  const titleId = useId()
  const accentStyle = {'--realm-accent': realmAccent} as CSSProperties
  const resolvedDossierSrc = media.dossierSrc ?? media.posterSrc
  const hybridMode = useHybridDatabaseCardMode()
  const imageMode =
    layout === 'hybrid' ? (hybridMode === undefined ? 'poster' : hybridMode) : 'poster'
  const isDossierMode = imageMode === 'dossier'
  const activeImageSrc = isDossierMode ? resolvedDossierSrc : media.posterSrc
  const activeImageClassName = isDossierMode
    ? (media.dossierClassName ?? 'object-cover object-top')
    : (media.posterClassName ?? 'object-cover object-top')

  return (
    <article
      className={`database-grid-card-frame database-grid-card-frame--${layout} group/card`}
      data-image-mode={imageMode ?? 'pending'}
      style={accentStyle}
    >
      <div className='database-grid-card__surface relative isolate grid min-w-0 overflow-hidden border border-[color-mix(in_srgb,var(--realm-accent)_48%,rgb(51_65_85)_52%)] bg-[rgb(7_15_27)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.025),0_8px_18px_rgba(2,6,23,0.22)] transition-[border-color,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] group-focus-within/card:border-[color-mix(in_srgb,var(--realm-accent)_66%,rgb(51_65_85)_34%)] group-focus-within/card:bg-[rgb(10_18_32)] group-focus-within/card:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_12px_24px_rgba(2,6,23,0.28)] group-hover/card:border-[color-mix(in_srgb,var(--realm-accent)_66%,rgb(51_65_85)_34%)] group-hover/card:bg-[rgb(10_18_32)] group-hover/card:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_12px_24px_rgba(2,6,23,0.28)] motion-reduce:transition-none'>
        <button
          aria-labelledby={`${titleId}-action ${titleId}`}
          className='absolute inset-0 z-30 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
          onClick={onSelect}
          type='button'
        >
          <span className='sr-only' id={`${titleId}-action`}>
            {actionLabel}
          </span>
        </button>

        <div
          className={`database-grid-card__art relative min-w-0 overflow-hidden border-b border-[color-mix(in_srgb,var(--realm-accent)_32%,rgb(30_41_59)_68%)] bg-[color-mix(in_oklab,var(--realm-accent)_8%,rgb(8_15_27))] ${media.posterAspectClassName ?? 'aspect-[4/5]'}`}
        >
          {imageMode ? (
            <>
              <CardImage
                alt={media.alt}
                className={`database-grid-card__image h-full w-full ${activeImageClassName}`}
                prioritize={media.prioritize}
                src={activeImageSrc}
              />
              {!isDossierMode ? (
                <PosterBadge label={media.posterBadge?.label} src={media.posterBadge?.src} />
              ) : null}
            </>
          ) : (
            <PendingImage className='database-grid-card__image h-full w-full' />
          )}
        </div>

        <div className='database-grid-card__body grid min-w-0 content-center gap-1.5 bg-[linear-gradient(180deg,rgba(9,19,33,0.98),rgba(5,12,23,0.96))] px-2.5 py-2'>
          <div className='database-grid-card__title flex min-w-0 items-center gap-1.5' id={titleId}>
            {content.title}
            {isDossierMode && content.dossierTitleAddon ? (
              <span className='database-grid-card__dossier-title-addon hidden shrink-0'>
                {content.dossierTitleAddon}
              </span>
            ) : null}
          </div>
          {content.detail ? (
            <div className='database-grid-card__detail hidden min-w-0 text-[10.5px] leading-[1.25] font-medium tracking-[0.035em] text-slate-400'>
              {content.detail}
            </div>
          ) : null}
          {content.meta ? (
            <div className='database-grid-card__meta min-w-0'>{content.meta}</div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
