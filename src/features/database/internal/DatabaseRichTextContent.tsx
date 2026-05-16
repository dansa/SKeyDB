import {useMemo} from 'react'

import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {
  buildDatabaseRichTextParseContext,
  parseDatabaseRichDescriptionWithContext,
} from '@/domain/database-rich-text'
import type {DescribedRecord} from '@/domain/description-records'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {
  RichSegmentRenderer,
  type ActivationEvent,
  type RichSegmentRendererVariant,
} from './RichSegmentRenderer'

const EMPTY_CARD_NAMES = new Set<string>()

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
  const resolvedOverlays = useMemo(() => referenceLayer?.accessibleOverlays ?? [], [referenceLayer])
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

  return (
    <>
      {segments.map((segment, index) => (
        <RichSegmentRenderer
          descriptionArgs={record?.descriptionArgs}
          formulaContext={formulaContext}
          descriptionMaxRank={descriptionMaxRank}
          descriptionRank={descriptionRank}
          key={index}
          onMechanicClick={onMechanicClick}
          onSkillClick={onSkillClick}
          overlayByName={referenceLayer?.overlayByName}
          overlays={resolvedOverlays}
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
