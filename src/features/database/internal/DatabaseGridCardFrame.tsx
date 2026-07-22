import {useEffect, useId, useRef, type CSSProperties, type ReactNode} from 'react'

export type DatabaseGridCardImageTreatment = 'badge' | 'cover-top' | 'emblem' | 'wheel'
export type DatabaseCardVariant = 'poster' | 'dossier' | 'square-art'
export type HybridDatabaseCardMode = Extract<DatabaseCardVariant, 'poster' | 'dossier'>

type DatabaseGridCardDetailVisibility = 'all' | 'dossier' | 'poster'

type RealmAccentStyle = CSSProperties & {'--realm-accent': string}

const DATABASE_CARD_RENDER_ROOT_MARGIN = '900px 0px'
let databaseCardRenderObserver: IntersectionObserver | null | undefined

function getDatabaseCardRenderObserver() {
  if (databaseCardRenderObserver !== undefined) {
    return databaseCardRenderObserver
  }

  if (typeof IntersectionObserver === 'undefined') {
    databaseCardRenderObserver = null
    return databaseCardRenderObserver
  }

  databaseCardRenderObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute('data-near-viewport', entry.isIntersecting)
      }
    },
    {rootMargin: DATABASE_CARD_RENDER_ROOT_MARGIN},
  )
  return databaseCardRenderObserver
}

function useDatabaseCardRenderWindow() {
  const frameRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) {
      return
    }

    const observer = getDatabaseCardRenderObserver()
    if (!observer) {
      frame.setAttribute('data-near-viewport', '')
      return () => {
        frame.removeAttribute('data-near-viewport')
      }
    }

    observer.observe(frame)
    return () => {
      observer.unobserve(frame)
      frame.removeAttribute('data-near-viewport')
    }
  }, [])

  return frameRef
}

interface DatabaseGridCardDetail {
  body: ReactNode
  visibility: DatabaseGridCardDetailVisibility
}

interface DatabaseGridCardBaseProps {
  actionLabel?: string
  onPreload?: () => void
  onSelect: () => void
  realmAccent: string
}

interface DatabaseGridCardBaseMedia {
  alt: string
  posterSrc: string | undefined
  prioritize: boolean
}

interface HybridDatabaseGridCardFrameProps extends DatabaseGridCardBaseProps {
  content: {
    detail?: DatabaseGridCardDetail
    dossierTitleAddon?: ReactNode
    meta?: ReactNode
    title: string
  }
  media: DatabaseGridCardBaseMedia & {
    dossierSrc?: string | undefined
    posterBadge?: {
      label?: string | undefined
      src?: string | undefined
    }
    dossierTreatment?: DatabaseGridCardImageTreatment
    posterTreatment?: DatabaseGridCardImageTreatment
  }
  variant: HybridDatabaseCardMode
}

interface SquareArtDatabaseGridCardFrameProps extends DatabaseGridCardBaseProps {
  content: {
    detail?: never
    dossierTitleAddon?: never
    corner?: ReactNode
    meta?: ReactNode
    title: string
  }
  media: DatabaseGridCardBaseMedia & {
    dossierSrc?: never
    dossierTreatment?: never
    posterBadge?: never
    posterTreatment: Extract<DatabaseGridCardImageTreatment, 'badge' | 'emblem'>
  }
  variant: 'square-art'
}

type DatabaseGridCardFrameProps =
  | HybridDatabaseGridCardFrameProps
  | SquareArtDatabaseGridCardFrameProps

function NoImage() {
  return <div className='database-grid-card__no-image'>No Image</div>
}

function CardImage({
  alt,
  prioritize,
  src,
  treatment,
}: {
  alt: string
  prioritize: boolean
  src: string | undefined
  treatment: DatabaseGridCardImageTreatment
}) {
  if (!src) {
    return <NoImage />
  }

  return (
    <div className='database-grid-card__image-plane'>
      <img
        alt={alt}
        className='database-grid-card__image'
        data-treatment={treatment}
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
      className='database-grid-card__poster-badge'
      draggable={false}
      src={src}
      title={label}
    />
  )
}

function shouldShowDetail(
  variant: HybridDatabaseCardMode,
  visibility: DatabaseGridCardDetailVisibility,
) {
  return visibility === 'all' || visibility === variant
}

export function DatabaseGridCardFrame({
  actionLabel = 'View details for',
  content,
  media,
  onPreload,
  onSelect,
  realmAccent,
  variant,
}: DatabaseGridCardFrameProps) {
  const frameRef = useDatabaseCardRenderWindow()
  const titleId = useId()
  const accentStyle: RealmAccentStyle = {'--realm-accent': realmAccent}
  const resolvedDossierSrc = media.dossierSrc ?? media.posterSrc
  const isDossierMode = variant === 'dossier'
  const renderedDetail =
    variant !== 'square-art' &&
    content.detail &&
    shouldShowDetail(variant, content.detail.visibility)
      ? content.detail.body
      : null
  const activeImageSrc = isDossierMode ? resolvedDossierSrc : media.posterSrc
  const activeImageTreatment = isDossierMode
    ? (media.dossierTreatment ?? media.posterTreatment ?? 'cover-top')
    : (media.posterTreatment ?? 'cover-top')

  return (
    <article
      className='database-grid-card-frame'
      data-card-variant={variant}
      data-has-meta={content.meta ? '' : undefined}
      ref={frameRef}
      style={accentStyle}
    >
      <div className='database-grid-card__surface'>
        <button
          aria-labelledby={`${titleId}-action ${titleId}`}
          className='database-grid-card__button'
          onFocus={onPreload}
          onClick={onSelect}
          onPointerDown={onPreload}
          onPointerEnter={onPreload}
          type='button'
        >
          <span className='sr-only' id={`${titleId}-action`}>
            {actionLabel}
          </span>
        </button>

        {'corner' in content && content.corner ? (
          <div className='database-grid-card__corner'>{content.corner}</div>
        ) : null}

        <div className='database-grid-card__art'>
          <CardImage
            alt={media.alt}
            prioritize={media.prioritize}
            src={activeImageSrc}
            treatment={activeImageTreatment}
          />
          {!isDossierMode ? (
            <PosterBadge label={media.posterBadge?.label} src={media.posterBadge?.src} />
          ) : null}
        </div>

        <div className='database-grid-card__body'>
          <div className='database-grid-card__title' id={titleId}>
            <p className='database-grid-card__title-text' title={content.title}>
              {content.title}
            </p>
            {isDossierMode && content.dossierTitleAddon ? (
              <span className='database-grid-card__dossier-title-addon'>
                {content.dossierTitleAddon}
              </span>
            ) : null}
          </div>
          {renderedDetail !== null ? (
            <div
              className={
                isDossierMode ? 'database-grid-card__detail' : 'database-grid-card__poster-detail'
              }
            >
              {renderedDetail}
            </div>
          ) : null}
          {content.meta ? <div className='database-grid-card__meta'>{content.meta}</div> : null}
        </div>
      </div>
    </article>
  )
}
