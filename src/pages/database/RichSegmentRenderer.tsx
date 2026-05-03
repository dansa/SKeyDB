import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import {
  buildDescriptionArgHover,
  hasDescriptionArgInteractiveHover,
  resolveDescriptionArg,
} from '@/domain/description-args'
import {loadOverlayIconAsset, peekOverlayIconAsset} from '@/domain/overlay-icon-assets'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {
  buildRichScalingHover,
  computeRichScalingStatRange,
  computeRichScalingStatValue,
  formatRichScalingRange,
} from '@/domain/rich-scaling'
import type {RichSegment, ScalingSegment} from '@/domain/rich-text'
import {fmtNum} from '@/domain/scaling'

import {renderTextWithBreaks} from './font-scale'
import {
  DATABASE_INTERACTIVE_TOKEN_CLASS,
  DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_SCALING_TOKEN_CLASS,
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_REFERENCE_TOKEN_CLASS,
  DATABASE_SCALING_GROUP_CLASS,
  DATABASE_SCALING_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
  DATABASE_TINTED_TOKEN_CLASS,
  DATABASE_UNIMPLEMENTED_TOKEN_CLASS,
  getDatabaseDescriptionArgTint,
  getDatabaseOverlayTint,
  getDatabaseRealmTint,
  getDatabaseTintedTokenStyle,
} from './text-styles'

export type RichSegmentRendererVariant = 'inline' | 'popover'

interface RichSegmentRendererProps {
  segment: RichSegment
  variant: RichSegmentRendererVariant
  skillLevel: number
  stats: FullStats | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
  descriptionArgs?: Record<string, PublicDescriptionArg>
  formulaContext?: PublicFormulaContext
  descriptionRank?: number
  descriptionMaxRank?: number
  overlays?: readonly AwakenerOverlayRecord[]
  onSkillClick?: (name: string, event: MouseEvent<HTMLElement>) => void
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: MouseEvent<HTMLElement>) => void
}

interface RichScalingSegmentProps {
  segment: ScalingSegment
  skillLevel: number
  stats: FullStats | null
  showVisibleScaling: boolean
  variant: RichSegmentRendererVariant
}

interface InteractiveTokenProps {
  ariaLabel: string
  children: ReactNode
  className: string
  onActivate: (event: MouseEvent<HTMLElement>) => void
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

function InteractiveToken({
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

export function RichSegmentRenderer({
  segment,
  variant,
  skillLevel,
  stats,
  showVisibleScaling = true,
  showTagIcons = true,
  descriptionArgs,
  formulaContext,
  descriptionRank,
  descriptionMaxRank,
  overlays,
  onSkillClick,
  onMechanicClick,
}: RichSegmentRendererProps) {
  switch (segment.type) {
    case 'text':
      return <>{renderTextWithBreaks(segment.value)}</>

    case 'skill':
      if (!onSkillClick) {
        return <span>{segment.name}</span>
      }
      return (
        <InteractiveToken
          ariaLabel={segment.name}
          className={DATABASE_INTERACTIVE_TOKEN_CLASS}
          onActivate={(event) => {
            onSkillClick(segment.name, event)
          }}
          style={{fontSize: 'inherit'}}
        >
          {segment.name}
        </InteractiveToken>
      )

    case 'reference':
      return <span className={DATABASE_REFERENCE_TOKEN_CLASS}>{segment.name}</span>

    case 'stat':
      return (
        <span
          className={
            variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
          }
        >
          {segment.name}
        </span>
      )

    case 'mechanic': {
      const overlay = resolveOverlayFromList(segment.name, overlays)
      const desc = overlay?.descriptionTemplate.trim()
      const tint = getDatabaseOverlayTint(overlay)
      const tintStyle = getDatabaseTintedTokenStyle(tint)
      const title = !overlay || !desc ? 'Details coming soon' : undefined
      if (overlay && desc && onMechanicClick) {
        return (
          <InteractiveToken
            ariaLabel={segment.name}
            className={`${DATABASE_INTERACTIVE_TOKEN_CLASS}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''} inline whitespace-nowrap`}
            onActivate={(event) => {
              onMechanicClick(overlay, event)
            }}
            style={{...tintStyle, fontSize: 'inherit'}}
            title={title}
          >
            <OverlayTokenLabel
              name={segment.name}
              overlay={overlay}
              showTagIcons={showTagIcons}
              variant='interactive'
            />
          </InteractiveToken>
        )
      }
      return (
        <OverlayTokenLabel
          name={segment.name}
          overlay={overlay}
          showTagIcons={showTagIcons}
          textStyle={tintStyle}
          title={title}
          variant={overlay && desc ? 'plain' : 'unimplemented'}
        />
      )
    }

    case 'realm': {
      const overlay = resolveOverlayFromList(segment.name, overlays)
      const tint = getDatabaseRealmTint(segment.name)
      const tintStyle = getDatabaseTintedTokenStyle(tint)
      if (overlay && onMechanicClick) {
        return (
          <InteractiveToken
            ariaLabel={segment.name}
            className={`${DATABASE_INTERACTIVE_TOKEN_CLASS} ${DATABASE_TINTED_TOKEN_CLASS}`}
            onActivate={(event) => {
              onMechanicClick(overlay, event)
            }}
            style={{...tintStyle, fontSize: 'inherit'}}
          >
            {segment.name}
          </InteractiveToken>
        )
      }
      return <span style={{color: tint.base}}>{segment.name}</span>
    }

    case 'scaling':
      return (
        <RichScalingSegment
          segment={segment}
          showVisibleScaling={showVisibleScaling}
          skillLevel={skillLevel}
          stats={stats}
          variant={variant}
        />
      )

    case 'descriptionArg': {
      const arg = descriptionArgs?.[segment.argKey]
      if (!arg) {
        return <>{`[${segment.channel ? `${segment.channel}:` : ''}${segment.argKey}]`}</>
      }

      return (
        <DescriptionArgSegmentView
          arg={arg}
          channel={segment.channel}
          formulaContext={formulaContext}
          maxRank={descriptionMaxRank}
          rank={descriptionRank ?? skillLevel}
          showVisibleScaling={showVisibleScaling}
          stats={stats}
          variant={variant}
        />
      )
    }

    case 'argPlural': {
      const arg = descriptionArgs?.[segment.argKey]
      if (!arg) {
        return <>{segment.plural}</>
      }

      const resolved = resolveDescriptionArg(arg, {
        rank: descriptionRank ?? skillLevel,
        stats,
        formulaContext,
      })
      const value = resolved.absoluteValue ?? resolved.totalValue ?? resolved.baseValue
      return <>{value === 1 ? segment.singular : segment.plural}</>
    }
  }
}

function OverlayTokenLabel({
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
        style={{
          display: 'inline',
          width: '0.95em',
          height: '0.95em',
          objectFit: 'contain',
          verticalAlign: 'middle',
          position: 'relative',
          top: '-0.04em',
        }}
      />
      <span className={textClassName} style={textStyle}>
        {name}
      </span>
    </span>
  )
}

function createTokenKeyDownHandler(
  onActivate: (event: MouseEvent<HTMLElement>) => void,
): (event: KeyboardEvent<HTMLElement>) => void {
  return (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    onActivate(event as unknown as MouseEvent<HTMLElement>)
  }
}

function RichScalingSegment({
  segment,
  skillLevel,
  stats,
  showVisibleScaling,
  variant,
}: RichScalingSegmentProps) {
  if (variant === 'popover') {
    const display = formatRichScalingRange(segment)
    const computed = computeRichScalingStatRange(segment, stats)
    const hoverText = buildRichScalingHover(segment, stats)
    if (computed) {
      return (
        <span title={hoverText}>
          <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>{computed}</span>
          {showVisibleScaling ? (
            <span className='text-slate-500'>
              {' '}
              ({display}
              {segment.stat ? ` ${segment.stat}` : ''})
            </span>
          ) : null}
        </span>
      )
    }
    return (
      <span className={DATABASE_POPOVER_SCALING_TOKEN_CLASS}>
        {display}
        {segment.stat ? (
          <>
            {' '}
            <span className={DATABASE_POPOVER_STAT_TOKEN_CLASS}>{segment.stat}</span>
          </>
        ) : null}
      </span>
    )
  }

  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeRichScalingStatValue(value, segment.suffix, segment.stat, stats)
  const hoverText = buildRichScalingHover(segment, stats)

  if (computed !== null) {
    return (
      <span className={DATABASE_SCALING_GROUP_CLASS} title={hoverText}>
        <span className={DATABASE_SCALING_TOKEN_CLASS}>{computed}</span>
        {showVisibleScaling ? (
          <span className='text-slate-500 no-underline'>
            {' '}
            ({displayValue}
            {segment.suffix}
            {segment.stat ? ` ${segment.stat}` : ''})
          </span>
        ) : null}
      </span>
    )
  }

  return (
    <span className={DATABASE_SCALING_TOKEN_CLASS} title={hoverText}>
      {displayValue}
      {segment.suffix}
      {segment.stat ? (
        <>
          {' '}
          <span className={DATABASE_STAT_TOKEN_CLASS}>{segment.stat}</span>
        </>
      ) : null}
    </span>
  )
}

function DescriptionArgSegmentView({
  arg,
  channel,
  rank,
  maxRank,
  formulaContext,
  showVisibleScaling,
  stats,
  variant,
}: {
  arg: PublicDescriptionArg
  channel: string | null
  rank: number
  maxRank: number | undefined
  formulaContext: PublicFormulaContext | undefined
  showVisibleScaling: boolean
  stats: FullStats | null
  variant: RichSegmentRendererVariant
}) {
  const resolved = resolveDescriptionArg(arg, {rank, stats, formulaContext})
  const hoverText = buildDescriptionArgHover(arg, {rank, maxRank, stats, formulaContext})
  const isInteractive = hasDescriptionArgInteractiveHover(arg)
  const formulaText = resolved.formattedTotalValue.replaceAll('{', '').replaceAll('}', '')
  const scalingClass =
    variant === 'popover'
      ? DATABASE_POPOVER_INTERACTIVE_SCALING_TOKEN_CLASS
      : DATABASE_SCALING_TOKEN_CLASS
  const statClass =
    variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
  const plainClass =
    variant === 'popover' ? DATABASE_POPOVER_SCALING_TOKEN_CLASS : 'text-amber-100/85'
  const tint = getDatabaseDescriptionArgTint(channel ?? arg.channel ?? null)
  const tintStyle = getDatabaseTintedTokenStyle(tint)
  const hoverProps = isInteractive && hoverText ? {title: hoverText} : {}

  if (resolved.absoluteValue !== null) {
    return (
      <span className={isInteractive ? DATABASE_SCALING_GROUP_CLASS : plainClass} {...hoverProps}>
        <span
          className={`${isInteractive ? scalingClass : plainClass}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''}`.trim()}
          style={tintStyle}
        >
          {resolved.absoluteValue}
        </span>
        {showVisibleScaling ? (
          <span className='text-slate-500 no-underline'>
            {' '}
            ({formulaText.replace(/\b(ATK|DEF|CON)\b/g, '$1')})
          </span>
        ) : null}
      </span>
    )
  }

  if (resolved.stat) {
    const [prefix] = formulaText.split(` ${resolved.stat}`)
    return (
      <span className={isInteractive ? scalingClass : plainClass} {...hoverProps}>
        <span className={tintStyle ? DATABASE_TINTED_TOKEN_CLASS : undefined} style={tintStyle}>
          {prefix}
        </span>{' '}
        <span className={statClass}>{resolved.stat}</span>
      </span>
    )
  }

  return (
    <span
      className={`${isInteractive ? scalingClass : plainClass}${tintStyle ? ` ${DATABASE_TINTED_TOKEN_CLASS}` : ''}`.trim()}
      style={tintStyle}
      {...hoverProps}
    >
      {formulaText}
    </span>
  )
}
