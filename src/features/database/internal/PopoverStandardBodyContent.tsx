import {memo, Suspense, type MouseEvent} from 'react'

import type {FullStats} from '@/domain/awakener-source-schema'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {
  descriptionSectionClassName,
  getRelatedReferences,
  useResolvedDescriptionFallbackText,
} from './DatabaseReferencePopoverHelpers'
import {DatabaseRichTextContent, type DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {scaledFontStyle} from './font-scale'
import {ExpandableContent} from './PopoverAtoms'
import {
  PopoverAttributesTable,
  PopoverDetailLinks,
  PopoverRelatedSkills,
  TextWithBreaksFallback,
} from './PopoverSubComponents'

function PopoverRichText({
  fallbackText,
  contentProps,
  record,
  text,
  isSection,
}: {
  fallbackText: string
  contentProps: DatabaseRichTextContentProps
  record?: KeyedDatabaseReferenceEntry['record']
  text: string
  isSection?: boolean
}) {
  return (
    <Suspense fallback={fallbackText ? <TextWithBreaksFallback text={fallbackText} /> : null}>
      <DatabaseRichTextContent
        {...contentProps}
        record={
          record ??
          (contentProps.record
            ? isSection
              ? {...contentProps.record, descriptionTemplate: text}
              : contentProps.record
            : undefined)
        }
        text={text}
      />
    </Suspense>
  )
}

const PopoverDescriptionSection = memo(function PopoverDescriptionSection({
  section,
  entryRank,
  formulaContext,
  stats,
  contentProps,
}: {
  section: NonNullable<KeyedDatabaseReferenceEntry['descriptionSections']>[number]
  entryRank?: number
  formulaContext?: PublicFormulaContext
  stats: FullStats | null
  contentProps: DatabaseRichTextContentProps
}) {
  const sectionFallbackText = useResolvedDescriptionFallbackText({
    description: section.description,
    formulaContext,
    rank: entryRank,
    record: section.record,
    stats,
  })

  return (
    <div>
      <p className='ui-title mb-1 text-[12px] text-amber-100/82' style={scaledFontStyle(12)}>
        {section.label}
      </p>
      <p className={descriptionSectionClassName(section.tone)} style={scaledFontStyle(11)}>
        <PopoverRichText
          contentProps={contentProps}
          fallbackText={sectionFallbackText}
          record={section.record}
          text={section.description}
          isSection={true}
        />
      </p>
    </div>
  )
})

const PopoverFactionSection = memo(function PopoverFactionSection({
  section,
  entryRank,
  formulaContext,
  stats,
  contentProps,
}: {
  section: NonNullable<KeyedDatabaseReferenceEntry['descriptionSections']>[number]
  entryRank?: number
  formulaContext?: PublicFormulaContext
  stats: FullStats | null
  contentProps: DatabaseRichTextContentProps
}) {
  const sectionFallbackText = useResolvedDescriptionFallbackText({
    description: section.description,
    formulaContext,
    rank: entryRank,
    record: section.record,
    stats,
  })

  return (
    <div className='rounded-none border border-slate-800/40 bg-slate-900/10 px-2.5 py-1.5'>
      <span
        className='mb-0.5 block text-[11px] font-semibold text-amber-100/90'
        style={scaledFontStyle(11)}
      >
        {section.label}
      </span>
      <span
        className='block text-[10.5px] leading-relaxed text-slate-400'
        style={scaledFontStyle(10.5)}
      >
        <PopoverRichText
          contentProps={contentProps}
          fallbackText={sectionFallbackText}
          record={section.record}
          text={section.description}
          isSection={true}
        />
      </span>
    </div>
  )
})

export interface PopoverStandardBodyContentProps {
  entry: KeyedDatabaseReferenceEntry
  attributeRows?: KeyedDatabaseReferenceEntry['attributeRows']
  descriptionSections?: KeyedDatabaseReferenceEntry['descriptionSections']
  detailLinks?: KeyedDatabaseReferenceEntry['detailLinks']
  relatedReferences?: ReturnType<typeof getRelatedReferences>
  fallbackText: string
  contentProps: DatabaseRichTextContentProps
  onSkillTokenClick: (name: string, event?: MouseEvent) => void
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => void
  formulaContext?: PublicFormulaContext
  stats: FullStats | null
}

const EMPTY_ARRAY: never[] = []

export const PopoverStandardBodyContent = memo(function PopoverStandardBodyContent({
  entry,
  attributeRows = EMPTY_ARRAY,
  descriptionSections = EMPTY_ARRAY,
  detailLinks = EMPTY_ARRAY,
  relatedReferences = EMPTY_ARRAY,
  fallbackText,
  contentProps,
  onSkillTokenClick,
  onInfoEntryClick,
  formulaContext,
  stats,
}: PopoverStandardBodyContentProps) {
  return (
    <>
      {attributeRows.length > 0 && (
        <PopoverAttributesTable entryKey={entry.key} rows={attributeRows} />
      )}
      <ExpandableContent>
        {descriptionSections.length > 0 ? (
          entry.key.startsWith('dzone-monster') ? (
            (() => {
              const loreSection = descriptionSections.find((s) => s.label === 'Description')
              const characteristics = descriptionSections.filter((s) => s.label !== 'Description')
              return (
                <div className='space-y-3'>
                  {loreSection && (
                    <PopoverDescriptionSection
                      section={loreSection}
                      entryRank={entry.descriptionRank}
                      formulaContext={formulaContext}
                      stats={stats}
                      contentProps={contentProps}
                    />
                  )}
                  {characteristics.length > 0 && (
                    <div className='space-y-2 border-t border-slate-700/30 pt-2.5'>
                      <p
                        className='ui-title mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase'
                        style={scaledFontStyle(10)}
                      >
                        Factions
                      </p>
                      <div className='flex flex-col gap-y-2'>
                        {characteristics.map((section) => (
                          <PopoverFactionSection
                            key={section.label}
                            section={section}
                            entryRank={entry.descriptionRank}
                            formulaContext={formulaContext}
                            stats={stats}
                            contentProps={contentProps}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            <div className='space-y-3'>
              {descriptionSections.map((section) => (
                <PopoverDescriptionSection
                  key={section.label}
                  section={section}
                  entryRank={entry.descriptionRank}
                  formulaContext={formulaContext}
                  stats={stats}
                  contentProps={contentProps}
                />
              ))}
            </div>
          )
        ) : (
          <p className='leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
            <PopoverRichText
              contentProps={contentProps}
              fallbackText={fallbackText}
              text={entry.description}
            />
          </p>
        )}
      </ExpandableContent>
      {detailLinks.length > 0 && onInfoEntryClick && (
        <PopoverDetailLinks links={detailLinks} onInfoEntryClick={onInfoEntryClick} />
      )}
      {relatedReferences.length > 0 && (
        <PopoverRelatedSkills
          onInfoEntryClick={onInfoEntryClick}
          onSkillTokenClick={onSkillTokenClick}
          relatedReferences={relatedReferences}
        />
      )}
    </>
  )
})
