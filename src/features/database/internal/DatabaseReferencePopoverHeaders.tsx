import {type MouseEvent} from 'react'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import {
  buildDatabaseOverlayLabel,
  type ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'

import {AwakenerEnlightenInfluenceBadges} from './AwakenerEnlightenInfluenceBadges'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabaseLoreMarkupText} from './DatabaseLoreMarkupText'
import {scaledFontStyle, scaledPixelValue} from './font-scale'
import type {PopoverHeaderModel} from './popover-header-model'
import {SkillHeaderIcon, SkillHeaderValue, type SkillType} from './PopoverAtoms'
import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_CONTENT_FONT_SIZE,
  getDatabaseOverlayTint,
  getDatabaseSkillNameColor,
} from './text-styles'

function getStatColor(statName: string | null): string {
  if (statName === null) {
    return 'text-amber-200'
  }

  const upperName = statName.toUpperCase()
  if (upperName.includes('ATK')) {
    return 'text-red-400'
  }

  if (upperName.includes('CON')) {
    return 'text-green-400'
  }

  if (upperName.includes('DEF')) {
    return 'text-blue-400'
  }

  return 'text-amber-200'
}

function cleanLabelCost(label: string, isExalt?: boolean): string {
  let cleaned = label.replace(/\s*·\s*Cost\s+.+$/i, '').trim()
  if (isExalt) {
    cleaned = cleaned.replace(/^Card\s*·\s*/i, '').trim()
  }
  return cleaned
}

function resolveSkillType(entry: KeyedDatabaseReferenceEntry): SkillType | undefined {
  if (!entry.key) {
    return undefined
  }

  if (entry.key.startsWith('talent:')) {
    return 'talent'
  }
  if (entry.key.startsWith('enlighten:')) {
    return 'enlighten'
  }

  const record = entry.record as {kind?: unknown; cost?: unknown} | undefined
  if (
    record?.kind === 'exalt' ||
    record?.kind === 'over_exalt' ||
    entry.key === 'Exalt' ||
    entry.key === 'OverExalt' ||
    entry.key.startsWith('exalt:') ||
    entry.key.startsWith('over-exalt:')
  ) {
    return 'exalt'
  }

  if (entry.key.startsWith('skill:') || entry.key.startsWith('derived-skill:')) {
    if (
      record?.kind === 'command' ||
      record?.kind === 'derivedSkill' ||
      typeof record?.cost === 'string'
    ) {
      return 'command'
    }
  }
  return undefined
}

export function buildScalingHeader(
  stat: string | null,
  sourceName?: string | null,
  onOpenReferenceName?: (name: string, event?: MouseEvent) => void,
): PopoverHeaderModel {
  const eyebrow = sourceName ? (
    <button
      onClick={(e) => {
        onOpenReferenceName?.(sourceName, e)
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      className='cursor-pointer text-left font-medium text-slate-400 underline decoration-slate-600/50 transition-colors duration-150 hover:text-amber-200 hover:decoration-amber-300/40'
      style={scaledFontStyle(9.5)}
      type='button'
    >
      {sourceName}
    </button>
  ) : undefined

  return stat
    ? {
        title: (
          <span className='flex items-center gap-2'>
            <span className={getStatColor(stat)}>{stat}</span>
            <span className='h-[1em] w-px shrink-0 bg-white/10' />
            <span
              className='font-semibold tracking-tight text-amber-200'
              style={{fontSize: scaledPixelValue(DATABASE_POPOVER_CONTENT_FONT_SIZE)}}
            >
              Scaling
            </span>
          </span>
        ),
        titleClassName: 'font-semibold tracking-tight',
        titleStyle: {
          fontSize: scaledPixelValue(DATABASE_POPOVER_CONTENT_FONT_SIZE),
        },
        eyebrow,
      }
    : {
        title: 'Lvl Scaling',
        titleClassName: 'font-semibold tracking-tight text-amber-200',
        titleStyle: {
          fontSize: scaledPixelValue(DATABASE_POPOVER_CONTENT_FONT_SIZE),
        },
        eyebrow,
      }
}

/**
 * Finds the base Exalt cost for a given owner awakener ID.
 * Falls back to 100 if the cost cannot be determined.
 */
function findExaltBaseCost(
  ownerAwakenerId: string | number | undefined,
  referenceLayer: ResolvedDatabaseReferenceLayer | null,
): number {
  if (!ownerAwakenerId || !referenceLayer) {
    return 100
  }

  const idStr = String(ownerAwakenerId)

  for (const info of referenceLayer.referenceInfoById.values()) {
    if (info.kind === 'skill') {
      const describedRecord = info.record as {
        slot?: string
        ownerAwakenerId?: string | number
        cost?: string
      }

      if (
        describedRecord.slot === 'Exalt' &&
        describedRecord.ownerAwakenerId !== undefined &&
        String(describedRecord.ownerAwakenerId) === idStr
      ) {
        if (describedRecord.cost) {
          const parsed = Number.parseInt(describedRecord.cost, 10)

          if (!Number.isNaN(parsed) && parsed > 0) {
            return parsed
          }
        }
      }
    }
  }

  return 100
}

export function buildSkillHeader({
  entry,
  stats,
  onNavigate,
  onClose,
  selectedEnlightenSlot,
  onToggleEnlightenSlot,
  onOpenReferenceName,
  referenceLayer,
}: {
  entry: KeyedDatabaseReferenceEntry
  stats: FullStats | null
  onNavigate?: () => void
  onClose: () => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  onOpenReferenceName?: (name: string, event?: MouseEvent) => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
}): PopoverHeaderModel {
  const skillType = resolveSkillType(entry)
  const isExalt = skillType === 'exalt'
  const isOverExalt =
    isExalt &&
    ((entry.record as {kind?: unknown} | undefined)?.kind === 'over_exalt' ||
      (entry.record as {slot?: unknown} | undefined)?.slot === 'OverExalt' ||
      entry.key === 'OverExalt' ||
      entry.name.toLowerCase().includes('over'))

  const record = entry.record as {ownerAwakenerId?: string | number; cost?: string} | undefined
  const baseExaltCost = findExaltBaseCost(record?.ownerAwakenerId, referenceLayer)
  const cost = record?.cost ?? (isOverExalt ? String(baseExaltCost * 2) : String(baseExaltCost))
  const isRouse = entry.label.toLowerCase() === 'rouse' || entry.name.toLowerCase() === 'rouse'
  const skillNameColor = getDatabaseSkillNameColor({
    skillType,
    isOverExalt,
    isRouse,
  })

  const isCommandOrExalt = skillType === 'command' || skillType === 'exalt'

  const headerContent = (
    <span className='flex min-w-0 items-center gap-1.5 overflow-hidden'>
      {isCommandOrExalt && (
        <>
          <SkillHeaderIcon isInteractive={!!onNavigate} skillType={skillType} />
          <SkillHeaderValue
            cost={cost}
            isInteractive={!!onNavigate}
            isOverExalt={isOverExalt}
            label={entry.label}
            skillType={skillType}
            stats={stats}
          />
          <span className='mx-0.5 h-[1em] w-px shrink-0 bg-white/10' />
        </>
      )}
      <span className='flex min-w-0 items-center gap-2 overflow-hidden transition-colors'>
        <span
          className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-colors ${
            onNavigate ? 'group-hover:!text-amber-100' : ''
          }`}
          style={{color: skillNameColor}}
        >
          {entry.name}
        </span>
        {onNavigate && (
          <span className='flex max-w-[1.2em] shrink-0 items-center overflow-hidden opacity-100 transition-all duration-300 ease-in-out'>
            <span className='ml-1 text-slate-600 transition-colors group-hover:text-amber-300'>
              &#8599;
            </span>
          </span>
        )}
      </span>
    </span>
  )

  const hasInfluenceBadges = (entry.influenceBadges?.length ?? 0) > 0

  return {
    title: (
      <button
        aria-label={onNavigate ? `${entry.name} ↗` : undefined}
        className={`group flex w-fit min-w-0 items-center text-left transition-all ${
          onNavigate ? 'cursor-pointer' : 'cursor-default'
        }`}
        disabled={!onNavigate}
        onClick={() => {
          onClose()
          onNavigate?.()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 'inherit',
        }}
        title={onNavigate ? 'View in Skills tab' : undefined}
        type='button'
      >
        {headerContent}
      </button>
    ),
    eyebrow: entry.label ? (
      <div className='flex flex-wrap items-center gap-1.5'>
        <p className='text-slate-500' style={scaledFontStyle(11)}>
          {cleanLabelCost(entry.label, isExalt)}
        </p>
        {hasInfluenceBadges && (
          <AwakenerEnlightenInfluenceBadges
            influenceBadges={entry.influenceBadges ?? []}
            onOpenReferenceName={onOpenReferenceName}
            onToggleEnlightenSlot={onToggleEnlightenSlot}
            openMode='nested'
            selectedEnlightenSlot={selectedEnlightenSlot ?? null}
          />
        )}
      </div>
    ) : undefined,
  }
}

export function buildTagHeader({
  tagRecord,
  iconUrl,
}: {
  tagRecord: AwakenerOverlayRecord
  iconUrl?: string
}): PopoverHeaderModel {
  const color = getDatabaseOverlayTint(tagRecord)?.base
  const displayLabel = buildDatabaseOverlayLabel(tagRecord)
  return {
    icon: iconUrl ? (
      <img alt='' className='h-[1.15em] w-auto shrink-0 self-center' src={iconUrl} />
    ) : undefined,
    title: tagRecord.displayName,
    titleClassName: 'pt-0.5 font-semibold tracking-wide',
    titleStyle: {
      color: color ?? undefined,
      fontSize: scaledPixelValue(14),
    },
    eyebrow:
      tagRecord.overlayType !== 'tag' ? (
        <p className='text-slate-500/70' style={scaledFontStyle(9.5)}>
          {displayLabel}
        </p>
      ) : undefined,
  }
}

export function buildDefaultHeader({
  entry,
  onNavigate,
  onClose,
}: {
  entry: KeyedDatabaseReferenceEntry
  onNavigate?: () => void
  onClose: () => void
}): PopoverHeaderModel {
  return {
    icon: entry.thumbnail ? (
      <img
        alt={entry.thumbnail.alt ?? ''}
        aria-hidden={entry.thumbnail.alt ? undefined : true}
        className='size-9 shrink-0 border border-slate-700/55 bg-slate-900/70 object-contain p-0.5'
        draggable={false}
        src={entry.thumbnail.src}
      />
    ) : undefined,
    title:
      onNavigate && !entry.navigationLabel ? (
        <button
          className={`${DATABASE_ENTRY_TITLE_CLASS} transition-colors hover:text-amber-100`}
          onClick={() => {
            onClose()
            onNavigate()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
          style={scaledFontStyle(13)}
          type='button'
        >
          <DatabaseLoreMarkupText keyPrefix='database-popover-title-link' text={entry.name} /> ↗
        </button>
      ) : (
        <DatabaseLoreMarkupText keyPrefix='database-popover-title' text={entry.name} />
      ),
    titleClassName: DATABASE_ENTRY_TITLE_CLASS,
    titleStyle: scaledFontStyle(13),
    eyebrow: entry.label ? (
      <p className='text-slate-500' style={scaledFontStyle(11)}>
        {entry.labelSegments
          ? entry.labelSegments.map((segment, index) => (
              <span
                className={segment.tone === 'value' ? 'text-amber-100/72' : undefined}
                key={`${segment.text}:${index.toString()}`}
              >
                {segment.text}
              </span>
            ))
          : entry.label}
      </p>
    ) : undefined,
    accent:
      onNavigate && entry.navigationLabel ? (
        <button
          className='text-[10px] tracking-[0.16em] text-amber-100/80 uppercase transition-colors hover:text-amber-50'
          onClick={() => {
            onClose()
            onNavigate()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
          style={scaledFontStyle(11)}
          type='button'
        >
          {entry.navigationLabel} ↗
        </button>
      ) : undefined,
  }
}

export interface BuildPopoverHeaderOptions {
  entry: KeyedDatabaseReferenceEntry
  stats: FullStats | null
  isScaling: boolean
  isSkill: boolean
  tagRecord: AwakenerOverlayRecord | null
  iconUrl?: string
  onNavigate?: () => void
  onClose: () => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  onOpenReferenceName?: (name: string, event?: MouseEvent) => void
  sourceName?: string | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
}

export function buildPopoverHeader({
  entry,
  stats,
  isScaling,
  isSkill,
  tagRecord,
  iconUrl,
  onNavigate,
  onClose,
  selectedEnlightenSlot,
  onToggleEnlightenSlot,
  onOpenReferenceName,
  sourceName,
  referenceLayer,
}: BuildPopoverHeaderOptions): PopoverHeaderModel {
  if (isScaling) {
    return buildScalingHeader(entry.scalingStat ?? null, sourceName, onOpenReferenceName)
  }
  if (isSkill) {
    return buildSkillHeader({
      entry,
      stats,
      onNavigate,
      onClose,
      selectedEnlightenSlot,
      onToggleEnlightenSlot,
      onOpenReferenceName,
      referenceLayer,
    })
  }
  if (tagRecord) {
    return buildTagHeader({tagRecord, iconUrl})
  }
  if (entry.key.startsWith('wheel')) {
    return buildWheelHeader({entry, onNavigate, onClose})
  }
  return buildDefaultHeader({entry, onNavigate, onClose})
}

export function buildWheelHeader({
  entry,
  onNavigate,
  onClose,
}: {
  entry: KeyedDatabaseReferenceEntry
  onNavigate?: () => void
  onClose: () => void
}): PopoverHeaderModel {
  const navLabel = entry.navigationLabel ?? 'In DB'
  return {
    title: null,
    eyebrow: null,
    accent: onNavigate ? (
      <button
        className='text-[10px] tracking-[0.16em] text-amber-100/80 uppercase transition-colors hover:text-amber-50'
        onClick={() => {
          onClose()
          onNavigate()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        style={scaledFontStyle(11)}
        type='button'
      >
        {navLabel} ↗
      </button>
    ) : undefined,
  }
}
