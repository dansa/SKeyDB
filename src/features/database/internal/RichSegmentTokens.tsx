import {useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {normalizeDatabaseReferenceName} from '@/domain/database-reference-layer'
import {loadOverlayIconAsset, peekOverlayIconAsset} from '@/domain/overlay-icon-assets'

import {
  DATABASE_ACCENT_TEXT_CLASS,
  DATABASE_INHERIT_FONT_SIZE_CLASS,
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_TINTED_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseAccentTextStyle,
  getDatabaseOverlayTint,
  getDatabaseRealmTint,
  getDatabaseTintedTokenStyle,
} from './text-styles'

export type ActivationEvent = MouseEvent<HTMLButtonElement>

const OVERLAY_TOKEN_ICON_STYLE: CSSProperties = {
  display: 'inline',
  width: '0.95em',
  height: '0.95em',
  objectFit: 'contain',
  verticalAlign: 'middle',
  position: 'relative',
  top: '-0.04em',
}

interface InteractiveTokenProps {
  ariaLabel: string
  children: ReactNode
  className: string
  onActivate: (event: ActivationEvent) => void
  style?: CSSProperties
  title?: string
}

function resolveOverlay(
  name: string,
  overlayByName: ReadonlyMap<string, AwakenerOverlayRecord> | undefined,
): AwakenerOverlayRecord | null {
  return overlayByName?.get(normalizeDatabaseReferenceName(name)) ?? null
}

export function InteractiveToken({
  ariaLabel,
  children,
  className,
  onActivate,
  style,
  title,
}: InteractiveTokenProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`inline border-0 bg-transparent p-0 [font:inherit] ${className}`}
      onClick={(event) => {
        onActivate(event)
      }}
      style={style}
      title={title}
      type='button'
    >
      {children}
    </button>
  )
}

export function SkillToken({
  name,
  onSkillClick,
  referenceKind,
}: {
  name: string
  onSkillClick?: (name: string, event: ActivationEvent, referenceKind?: 'derived-skill') => void
  referenceKind?: 'derived-skill'
}) {
  if (!onSkillClick) {
    return <span>{name}</span>
  }

  return (
    <InteractiveToken
      ariaLabel={name}
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS}`}
      onActivate={(event) => {
        if (referenceKind) {
          onSkillClick(name, event, referenceKind)
          return
        }
        onSkillClick(name, event)
      }}
    >
      {name}
    </InteractiveToken>
  )
}

export function OverlayTokenLabel({
  name,
  overlay,
  showTagIcons,
  textStyle,
  title,
  variant,
}: {
  name: string
  overlay: AwakenerOverlayRecord | null
  showTagIcons: boolean
  textStyle?: CSSProperties
  title?: string
  variant: 'interactive' | 'plain' | 'unimplemented'
}) {
  const iconId = showTagIcons ? (overlay?.iconId ?? null) : null
  const cachedIconUrl = peekOverlayIconAsset(iconId)
  const [loadedIcon, setLoadedIcon] = useState<{iconId: string | null; url?: string}>({
    iconId,
    url: cachedIconUrl,
  })
  const textClassName = variant === 'unimplemented' ? DATABASE_UNIMPLEMENTED_TOKEN_CLASS : undefined
  const iconUrl = loadedIcon.iconId === iconId ? loadedIcon.url : cachedIconUrl

  useEffect(() => {
    let cancelled = false
    if (!iconId || cachedIconUrl) {
      return () => {
        cancelled = true
      }
    }

    void loadOverlayIconAsset(iconId).then((nextIconUrl) => {
      if (!cancelled) {
        setLoadedIcon({iconId, url: nextIconUrl})
      }
    })

    return () => {
      cancelled = true
    }
  }, [cachedIconUrl, iconId])

  if (!iconUrl) {
    return (
      <span className={textClassName} style={textStyle} title={title}>
        {name}
      </span>
    )
  }

  return (
    <span className='inline whitespace-nowrap' title={title}>
      <img
        alt=''
        aria-hidden='true'
        className='select-none'
        draggable={false}
        src={iconUrl}
        style={OVERLAY_TOKEN_ICON_STYLE}
      />
      <span className={textClassName} style={textStyle}>
        {name}
      </span>
    </span>
  )
}

export function MechanicToken({
  name,
  overlayByName,
  showTagIcons,
  onMechanicClick,
}: {
  name: string
  overlayByName?: ReadonlyMap<string, AwakenerOverlayRecord>
  showTagIcons: boolean
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}) {
  const overlay = resolveOverlay(name, overlayByName)
  const desc = overlay?.descriptionTemplate.trim()
  const tint = getDatabaseOverlayTint(overlay)
  const tintStyle = getDatabaseTintedTokenStyle(tint)
  const canOpenOverlay = Boolean(overlay && onMechanicClick)
  const title = !overlay || (!desc && !canOpenOverlay) ? 'Details coming soon' : undefined

  if (overlay && onMechanicClick) {
    return (
      <InteractiveToken
        ariaLabel={name}
        className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''} inline whitespace-nowrap`}
        onActivate={(event) => {
          onMechanicClick(overlay, event)
        }}
        style={tintStyle}
        title={title}
      >
        <OverlayTokenLabel
          name={name}
          overlay={overlay}
          showTagIcons={showTagIcons}
          variant='interactive'
        />
      </InteractiveToken>
    )
  }

  return (
    <OverlayTokenLabel
      name={name}
      overlay={overlay}
      showTagIcons={showTagIcons}
      textStyle={tintStyle}
      title={title}
      variant={overlay && desc ? 'plain' : 'unimplemented'}
    />
  )
}

export function RealmToken({
  name,
  overlayByName,
  onMechanicClick,
}: {
  name: string
  overlayByName?: ReadonlyMap<string, AwakenerOverlayRecord>
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}) {
  const overlay = resolveOverlay(name, overlayByName)
  const tint = getDatabaseRealmTint(name)
  const tintStyle = getDatabaseTintedTokenStyle(tint)

  if (overlay && onMechanicClick) {
    return (
      <InteractiveToken
        ariaLabel={name}
        className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS} ${DATABASE_TINTED_TOKEN_CLASS}`}
        onActivate={(event) => {
          onMechanicClick(overlay, event)
        }}
        style={tintStyle}
      >
        {name}
      </InteractiveToken>
    )
  }

  return (
    <span className={DATABASE_ACCENT_TEXT_CLASS} style={getDatabaseAccentTextStyle(tint.base)}>
      {name}
    </span>
  )
}
