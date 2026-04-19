import {useMemo, type MouseEvent} from 'react'

import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {parseDatabaseRichDescription} from '@/domain/database-rich-text'
import type {DescribedRecord} from '@/domain/description-records'

import {RichSegmentRenderer, type RichSegmentRendererVariant} from './RichSegmentRenderer'

export interface DatabaseRichTextContentProps {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  descriptionRank?: number
  descriptionMaxRank?: number
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
  skillLevel: number
  stats: FullStats | null
  variant: RichSegmentRendererVariant
  onSkillClick?: (name: string, event: MouseEvent<HTMLElement>) => void
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: MouseEvent<HTMLElement>) => void
}

export function DatabaseRichTextContent({
  text,
  record,
  keywordFooterText,
  descriptionRank,
  descriptionMaxRank,
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
  const segments = useMemo(
    () =>
      parseDatabaseRichDescription({
        text,
        record,
        keywordFooterText,
        referenceLayer,
      }),
    [keywordFooterText, record, referenceLayer, text],
  )

  return (
    <>
      {segments.map((segment, index) => (
        <RichSegmentRenderer
          descriptionArgs={record?.descriptionArgs}
          descriptionMaxRank={descriptionMaxRank}
          descriptionRank={descriptionRank}
          key={index}
          onMechanicClick={onMechanicClick}
          onSkillClick={onSkillClick}
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
