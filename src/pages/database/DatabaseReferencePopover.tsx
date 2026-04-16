import {lazy, Suspense} from 'react'

import {FaXmark} from 'react-icons/fa6'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  DerivedSkillRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import {resolveAwakenerDatabaseReferenceInfoById} from '@/domain/awakeners-database-reference-info'
import {
  type DatabaseReferenceInfo,
  type ResolvedAwakenerDatabaseReferenceLayer,
} from '@/domain/awakeners-database-view'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'

import {AwakenerEnlightenInfluenceBadges} from './AwakenerEnlightenInfluenceBadges'
import type {DatabaseReferenceEntry, KeyedDatabaseReferenceEntry} from './database-reference-entry'
import type {DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {renderTextWithBreaks, scaledFontStyle} from './font-scale'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

const DatabaseRichTextContent = lazy(() =>
  import('./DatabaseRichTextContent').then((module) => ({default: module.DatabaseRichTextContent})),
)

export type DatabaseReferencePopoverEntry = DatabaseReferenceEntry

interface DatabaseReferencePopoverProps {
  entry: DatabaseReferencePopoverEntry
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  referenceLayer?: ResolvedAwakenerDatabaseReferenceLayer | null
  stats: FullStats | null
  onClose: () => void
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry) => void
  onSkillTokenClick: (name: string) => void
  onMechanicTokenClick: (overlay: AwakenerOverlayRecord) => void
  onNavigateToCards?: () => void
  layerIndex?: number
  layerCount?: number
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

function isDerivedRecord(record: DatabaseReferenceEntry['record']): record is DerivedSkillRecord {
  return Boolean(record && 'childDerivedSkillIds' in record)
}

function getRelatedReferences(
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null,
  record: DatabaseReferenceEntry['record'],
): DatabaseReferenceInfo[] {
  if (!referenceLayer || !isDerivedRecord(record) || record.nodeKind !== 'group') {
    return []
  }

  return record.childDerivedSkillIds
    .map((childId) => resolveAwakenerDatabaseReferenceInfoById(referenceLayer, childId))
    .filter((entry): entry is DatabaseReferenceInfo => entry !== null)
}

function getRelatedReferencePreview(entry: DatabaseReferenceInfo): string {
  return entry.description.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
}

export function DatabaseReferencePopover({
  entry,
  selectedEnlightenSlot = null,
  onToggleEnlightenSlot,
  referenceLayer = null,
  stats,
  onClose,
  onInfoEntryClick,
  onSkillTokenClick,
  onMechanicTokenClick,
  onNavigateToCards,
  layerIndex = 0,
  layerCount = 1,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabaseReferencePopoverProps) {
  const relatedReferences = getRelatedReferences(referenceLayer, entry.record)
  const isTopLayer = layerIndex === layerCount - 1
  const containerClass = isTopLayer
    ? 'bg-slate-950/[.985] shadow-[0_18px_40px_rgba(2,6,23,0.78)]'
    : 'bg-slate-950/[.95] shadow-[0_10px_24px_rgba(2,6,23,0.58)]'
  const detailLinks = entry.detailLinks ?? []
  const fallbackText = buildDatabaseRichDescriptionText(
    entry.record?.descriptionTemplate ?? entry.description,
    entry.keywordFooterText,
  )
  const contentProps: DatabaseRichTextContentProps = {
    text: entry.description,
    record: entry.record,
    keywordFooterText: entry.keywordFooterText,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    referenceLayer,
    showVisibleScaling,
    showTagIcons,
    skillLevel: entry.descriptionRank ?? 1,
    stats,
    variant: 'popover',
    onMechanicClick: (overlay) => {
      onMechanicTokenClick(overlay)
    },
    onSkillClick: (skillName) => {
      onSkillTokenClick(skillName)
    },
  }

  return (
    <div
      className={`w-full border border-amber-200/35 ${containerClass}`}
      onClick={(event) => {
        event.stopPropagation()
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
      }}
    >
      <div className='flex items-start justify-between px-3 pt-2.5 pb-1.5'>
        <div
          className='min-w-0 flex-1 cursor-grab select-none active:cursor-grabbing'
          data-popover-drag-handle=''
        >
          {onNavigateToCards ? (
            <button
              className={`${DATABASE_ENTRY_TITLE_CLASS} transition-colors hover:text-amber-100`}
              onClick={() => {
                onClose()
                onNavigateToCards()
              }}
              style={scaledFontStyle(12)}
              title='View in Cards tab'
              type='button'
            >
              {entry.name} ↗
            </button>
          ) : (
            <p className={DATABASE_ENTRY_TITLE_CLASS} style={scaledFontStyle(12)}>
              {entry.name}
            </p>
          )}
          <p className='text-slate-500' style={scaledFontStyle(10)}>
            {entry.label}
          </p>
          {(entry.influenceBadges?.length ?? 0) > 0 ? (
            <div className='mt-1'>
              <AwakenerEnlightenInfluenceBadges
                influenceBadges={entry.influenceBadges ?? []}
                openMode='nested'
                onOpenReferenceName={onSkillTokenClick}
                onToggleEnlightenSlot={onToggleEnlightenSlot}
                selectedEnlightenSlot={selectedEnlightenSlot}
              />
            </div>
          ) : null}
        </div>
        <button
          aria-label='Close skill popover'
          className='-mt-1 -mr-1 ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-amber-100'
          onClick={() => {
            onClose()
          }}
          type='button'
        >
          <FaXmark className='h-3 w-3' />
        </button>
      </div>
      <div className='px-3 pb-3'>
        <p className='leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
          <Suspense
            fallback={fallbackText ? <span>{renderTextWithBreaks(fallbackText)}</span> : null}
          >
            <DatabaseRichTextContent {...contentProps} />
          </Suspense>
        </p>
        {detailLinks.length > 0 && onInfoEntryClick ? (
          <div className='mt-3 border-t border-slate-700/45 pt-2.5'>
            <p
              className='mb-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase'
              style={scaledFontStyle(10)}
            >
              More Details
            </p>
            <div className='space-y-1.5'>
              {detailLinks.map((detailLink) => (
                <button
                  className='block w-full border border-slate-700/45 bg-slate-900/45 px-2.5 py-2 text-left transition-colors hover:border-amber-200/40 hover:bg-slate-900/75'
                  key={detailLink.entry.key}
                  onClick={() => {
                    onInfoEntryClick(detailLink.entry)
                  }}
                  type='button'
                >
                  <span className='block text-[11px] text-slate-200' style={scaledFontStyle(11)}>
                    {detailLink.label}
                  </span>
                  <span
                    className='mt-0.5 block truncate text-[10px] text-slate-500'
                    style={scaledFontStyle(10)}
                  >
                    {detailLink.entry.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {relatedReferences.length > 0 ? (
          <div className='mt-3 border-t border-slate-700/45 pt-2.5'>
            <p
              className='mb-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase'
              style={scaledFontStyle(10)}
            >
              Related Cards
            </p>
            <div className='space-y-1.5'>
              {relatedReferences.map((entry) => (
                <button
                  className='block w-full border border-slate-700/45 bg-slate-900/45 px-2.5 py-2 text-left transition-colors hover:border-amber-200/40 hover:bg-slate-900/75'
                  key={entry.id}
                  onClick={() => {
                    onSkillTokenClick(entry.name)
                  }}
                  type='button'
                >
                  <span className='block text-[11px] text-slate-200' style={scaledFontStyle(11)}>
                    {entry.name}
                  </span>
                  <span
                    className='mt-0.5 block truncate text-[10px] text-slate-500'
                    style={scaledFontStyle(10)}
                  >
                    {getRelatedReferencePreview(entry)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
