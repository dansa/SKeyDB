import {lazy, Suspense} from 'react'

import {FaXmark} from 'react-icons/fa6'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  DerivedSkillRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import {resolveDatabaseReferenceInfoById} from '@/domain/database-reference-info'
import {
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'
import {resolveDescriptionTemplate} from '@/domain/description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

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
  referenceLayer?: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  stats: FullStats | null
  onClose: () => void
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry) => void
  onSkillTokenClick: (name: string) => void
  onMechanicTokenClick: (overlay: AwakenerOverlayRecord) => void
  onNavigate?: () => void
  layerIndex?: number
  layerCount?: number
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

function isDerivedRecord(record: DatabaseReferenceEntry['record']): record is DerivedSkillRecord {
  return Boolean(record && 'childDerivedSkillIds' in record)
}

function getRelatedReferences(
  referenceLayer: ResolvedDatabaseReferenceLayer | null,
  record: DatabaseReferenceEntry['record'],
): DatabaseReferenceInfo[] {
  if (!referenceLayer || !isDerivedRecord(record) || record.nodeKind !== 'group') {
    return []
  }

  return record.childDerivedSkillIds
    .map((childId) => resolveDatabaseReferenceInfoById(referenceLayer, childId))
    .filter((entry): entry is DatabaseReferenceInfo => entry !== null)
}

function getRelatedReferencePreview(entry: DatabaseReferenceInfo): string {
  return entry.description.replace(/[{}]/g, '').replace(/\s+/g, ' ').trim()
}

function buildRelatedReferenceEntry(entry: DatabaseReferenceInfo): KeyedDatabaseReferenceEntry {
  return {
    key: `${entry.kind}:${entry.id}`,
    name: entry.name,
    label: entry.label,
    description: entry.description,
    keywordFooterText: entry.keywordFooterText,
    record: entry.record,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    influenceBadges: entry.influenceBadges,
  }
}

export function DatabaseReferencePopover({
  entry,
  selectedEnlightenSlot = null,
  onToggleEnlightenSlot,
  referenceLayer = null,
  formulaContext,
  stats,
  onClose,
  onInfoEntryClick,
  onSkillTokenClick,
  onMechanicTokenClick,
  onNavigate,
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
  const descriptionSections = entry.descriptionSections ?? []
  const attributeRows = entry.attributeRows ?? []
  const fallbackSourceText = entry.record
    ? resolveDescriptionTemplate(entry.record.descriptionTemplate, entry.record.descriptionArgs, {
        rank: entry.descriptionRank,
        stats,
        formulaContext,
      })
    : entry.description
  const fallbackText = buildDatabaseRichDescriptionText(fallbackSourceText, entry.keywordFooterText)
  const contentProps: DatabaseRichTextContentProps = {
    text: entry.description,
    record: entry.record,
    keywordFooterText: entry.keywordFooterText,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    formulaContext,
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
          {onNavigate && !entry.navigationLabel ? (
            <button
              className={`${DATABASE_ENTRY_TITLE_CLASS} transition-colors hover:text-amber-100`}
              onClick={() => {
                onClose()
                onNavigate()
              }}
              style={scaledFontStyle(12)}
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
          {onNavigate && entry.navigationLabel ? (
            <button
              className='mt-1 text-[10px] tracking-[0.16em] text-amber-100/80 uppercase transition-colors hover:text-amber-50'
              onClick={() => {
                onClose()
                onNavigate()
              }}
              style={scaledFontStyle(10)}
              type='button'
            >
              {entry.navigationLabel} ↗
            </button>
          ) : null}
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
        {attributeRows.length > 0 ? (
          <div className='mb-3 flex flex-wrap gap-2 border-b border-slate-700/45 pb-3'>
            {attributeRows.map((row) => (
              <div
                className='flex min-w-0 items-center gap-2 border border-slate-700/45 bg-slate-900/45 px-2.5 py-2'
                key={`${row.label}:${row.value}`}
              >
                {row.iconSrc ? (
                  <img
                    alt=''
                    aria-hidden
                    className='h-4 w-4 shrink-0 object-contain opacity-90'
                    draggable={false}
                    src={row.iconSrc}
                  />
                ) : null}
                <span className='text-[10px] tracking-[0.16em] text-slate-500 uppercase'>
                  {row.label}
                </span>
                <span className='font-["Droid_Serif"] text-[13px] text-amber-100'>{row.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {descriptionSections.length > 0 ? (
          <div className='space-y-3'>
            {descriptionSections.map((section) => {
              const sectionFallbackSourceText = section.record
                ? resolveDescriptionTemplate(
                    section.record.descriptionTemplate,
                    section.record.descriptionArgs,
                    {
                      rank: entry.descriptionRank,
                      stats,
                      formulaContext,
                    },
                  )
                : section.description
              return (
                <div key={section.label}>
                  <p className='mb-1 text-[11px] text-slate-400' style={scaledFontStyle(11)}>
                    {section.label}
                  </p>
                  <p className='leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
                    <Suspense
                      fallback={
                        sectionFallbackSourceText ? (
                          <span>{renderTextWithBreaks(sectionFallbackSourceText)}</span>
                        ) : null
                      }
                    >
                      <DatabaseRichTextContent
                        {...contentProps}
                        record={section.record}
                        text={section.description}
                      />
                    </Suspense>
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className='leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
            <Suspense
              fallback={fallbackText ? <span>{renderTextWithBreaks(fallbackText)}</span> : null}
            >
              <DatabaseRichTextContent {...contentProps} />
            </Suspense>
          </p>
        )}
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
              Related Skills
            </p>
            <div className='space-y-1.5'>
              {relatedReferences.map((entry) => (
                <button
                  className='block w-full border border-slate-700/45 bg-slate-900/45 px-2.5 py-2 text-left transition-colors hover:border-amber-200/40 hover:bg-slate-900/75'
                  key={entry.id}
                  onClick={() => {
                    if (onInfoEntryClick) {
                      onInfoEntryClick(buildRelatedReferenceEntry(entry))
                      return
                    }
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
