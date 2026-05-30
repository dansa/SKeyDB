import {useMemo} from 'react'

import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {
  buildDatabaseRichTextParseContext,
  parseDatabaseRichDescriptionWithContext,
} from '@/domain/database-rich-text'
import type {DescribedRecord} from '@/domain/description-records'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import type {RichSegment} from '@/domain/rich-text'

import {
  RichSegmentRenderer,
  type ActivationEvent,
  type RichSegmentRendererVariant,
} from './RichSegmentRenderer'

const EMPTY_CARD_NAMES = new Set<string>()

function getRichSegmentKeyParts(segment: RichSegment): string {
  switch (segment.type) {
    case 'text':
      return `${segment.type}:${segment.value}`
    case 'skill':
    case 'stat':
    case 'mechanic':
    case 'reference':
    case 'realm':
      return `${segment.type}:${segment.name}`
    case 'scaling':
      return `${segment.type}:${segment.values.join('/')}:${segment.suffix}:${segment.stat ?? ''}`
    case 'descriptionArg':
      return `${segment.type}:${segment.channel ?? ''}:${segment.argKey}`
    case 'argPlural':
      return `${segment.type}:${segment.channel ?? ''}:${segment.argKey}:${segment.singular}:${segment.plural}`
  }
}

function getRichSegmentKeys(segments: RichSegment[]): string[] {
  const occurrences = new Map<string, number>()

  return segments.map((segment) => {
    const keyParts = getRichSegmentKeyParts(segment)
    const occurrence = occurrences.get(keyParts) ?? 0
    occurrences.set(keyParts, occurrence + 1)
    return `${keyParts}:${occurrence.toString()}`
  })
}

export interface DatabaseRichTextContentProps {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  descriptionRank?: number
  descriptionMaxRank?: number
  formulaContext?: PublicFormulaContext
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
  skillLevel: number
  stats: FullStats | null
  variant: RichSegmentRendererVariant
  onSkillClick?: (name: string, event: ActivationEvent) => void
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}

export function DatabaseRichTextContent({
  text,
  record,
  keywordFooterText,
  descriptionRank,
  descriptionMaxRank,
  formulaContext,
  referenceLayer,
  showVisibleScaling = true,
  showTagIcons = true,
  skillLevel,
  stats,
  variant,
  onSkillClick,
  onMechanicClick,
}: DatabaseRichTextContentProps) {
  const parseContext = useMemo(
    () =>
      buildDatabaseRichTextParseContext(
        referenceLayer?.cardNames ?? EMPTY_CARD_NAMES,
        record,
        referenceLayer,
      ),
    [record, referenceLayer],
  )
  const segments = useMemo(
    () =>
      parseDatabaseRichDescriptionWithContext({
        text,
        record,
        keywordFooterText,
        context: parseContext,
      }),
    [keywordFooterText, parseContext, record, text],
  )
  const segmentKeys = useMemo(() => getRichSegmentKeys(segments), [segments])

  return (
    <>
      {segments.map((segment, index) => (
        <RichSegmentRenderer
          descriptionArgs={record?.descriptionArgs}
          formulaContext={formulaContext}
          descriptionMaxRank={descriptionMaxRank}
          descriptionRank={descriptionRank}
          key={segmentKeys[index]}
          onMechanicClick={onMechanicClick}
          onSkillClick={onSkillClick}
          overlayByName={referenceLayer?.overlayByName}
          segment={segment}
          showVisibleScaling={showVisibleScaling}
          showTagIcons={showTagIcons}
          skillLevel={skillLevel}
          stats={stats}
          variant={variant}
        />
      ))}
    </>
  )
}
