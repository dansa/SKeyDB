import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

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

export type ActivationEvent = MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>

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

function resolveOverlayFromList(
  name: string,
  overlays: readonly AwakenerOverlayRecord[] | undefined,
): AwakenerOverlayRecord | null {
  if (!overlays) {
    return null
  }

  for (const overlay of overlays) {
    if (overlay.displayName === name || overlay.aliases.includes(name)) {
      return overlay
    }
  }

  return null
}

function resolveOverlay(
  name: string,
  overlayByName: ReadonlyMap<string, AwakenerOverlayRecord> | undefined,
  overlays: readonly AwakenerOverlayRecord[] | undefined,
): AwakenerOverlayRecord | null {
  const overlay = overlayByName?.get(normalizeDatabaseReferenceName(name))
  if (overlay) {
    return overlay
  }

  return resolveOverlayFromList(name, overlays)
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
    <span
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        onActivate(event)
      }}
      onKeyDown={createTokenKeyDownHandler((event) => {
        onActivate(event)
      })}
      role='button'
      style={style}
      tabIndex={0}
      title={title}
    >
      {children}
    </span>
  )
}

export function SkillToken({
  name,
  onSkillClick,
}: {
  name: string
  onSkillClick?: (name: string, event: ActivationEvent) => void
}) {
  if (!onSkillClick) {
    return <span>{name}</span>
  }

  return (
    <InteractiveToken
      ariaLabel={name}
      className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} ${DATABASE_INHERIT_FONT_SIZE_CLASS}`}
      onActivate={(event) => {
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
  overlays,
  showTagIcons,
  onMechanicClick,
}: {
  name: string
  overlayByName?: ReadonlyMap<string, AwakenerOverlayRecord>
  overlays?: readonly AwakenerOverlayRecord[]
  showTagIcons: boolean
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}) {
  const overlay = resolveOverlay(name, overlayByName, overlays)
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
  overlays,
  onMechanicClick,
}: {
  name: string
  overlayByName?: ReadonlyMap<string, AwakenerOverlayRecord>
  overlays?: readonly AwakenerOverlayRecord[]
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}) {
  const overlay = resolveOverlay(name, overlayByName, overlays)
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

function createTokenKeyDownHandler(
  onActivate: (event: ActivationEvent) => void,
): (event: KeyboardEvent<HTMLElement>) => void {
  return (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onActivate(event)
  }
}
