import type {FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {DescribedRecord} from '@/domain/description-records'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {RichDescription} from './RichDescription'

interface DatabaseScopedRichDescriptionProps {
  text?: string
  record?: DescribedRecord
  keywordFooterText?: string
  descriptionRank?: number
  descriptionMaxRank?: number
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  skillLevel?: number
  stats?: FullStats | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

export function DatabaseScopedRichDescription({
  text,
  record,
  keywordFooterText,
  descriptionRank,
  descriptionMaxRank,
  referenceLayer,
  formulaContext,
  skillLevel = 1,
  stats = null,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabaseScopedRichDescriptionProps) {
  return (
    <RichDescription
      descriptionMaxRank={descriptionMaxRank}
      descriptionRank={descriptionRank}
      formulaContext={formulaContext}
      keywordFooterText={keywordFooterText}
      record={record}
      referenceLayer={referenceLayer}
      showTagIcons={showTagIcons}
      showVisibleScaling={showVisibleScaling}
      skillLevel={skillLevel}
      stats={stats}
      text={text}
    />
  )
}
