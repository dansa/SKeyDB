import {lazy, Suspense} from 'react'

import type {FullStats} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'
import {resolveDescriptionTemplate} from '@/domain/description-args'
import type {DescribedRecord} from '@/domain/description-records'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {useDatabasePopoverControllerContext} from './database-popover-context'
import type {DatabaseRichTextContentProps} from './DatabaseRichTextContent'

const DatabaseRichTextContent = lazy(() =>
  import('./DatabaseRichTextContent').then((module) => ({default: module.DatabaseRichTextContent})),
)

interface RichDescriptionProps {
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

function TextWithBreaksFallback({text}: {text: string}) {
  const [firstPart, ...remainingParts] = getTextPartsWithKeys(text)

  return (
    <span>
      <span key={firstPart.key}>{firstPart.text}</span>
      {remainingParts.flatMap((part) => [
        <br key={`br:${part.key}`} />,
        <span key={part.key}>{part.text}</span>,
      ])}
    </span>
  )
}

function getTextPartsWithKeys(text: string): {key: string; text: string}[] {
  const occurrencesByText = new Map<string, number>()
  return text.split('\n').map((part) => {
    const occurrence = occurrencesByText.get(part) ?? 0
    occurrencesByText.set(part, occurrence + 1)
    return {key: `${part}:${String(occurrence)}`, text: part}
  })
}

export function RichDescription({
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
}: RichDescriptionProps) {
  const popoverController = useDatabasePopoverControllerContext()
  const fallbackSourceText = record
    ? resolveDescriptionTemplate(record.descriptionTemplate, record.descriptionArgs, {
        rank: descriptionRank ?? skillLevel,
        stats,
        formulaContext,
      })
    : text
  const fallbackText = buildDatabaseRichDescriptionText(fallbackSourceText, keywordFooterText)
  const contentProps: DatabaseRichTextContentProps = {
    text,
    record,
    keywordFooterText,
    descriptionRank,
    descriptionMaxRank,
    referenceLayer,
    formulaContext,
    showVisibleScaling,
    showTagIcons,
    skillLevel,
    stats,
    variant: 'inline',
    onMechanicClick: (overlay, event) => {
      popoverController?.openRootOverlay(overlay, event, {
        descriptionRank: descriptionRank ?? skillLevel,
        descriptionMaxRank,
        descriptionRankMode: 'current',
      })
    },
    onSkillClick: (name, event, referenceKind) => {
      popoverController?.openRootReferenceByName(name, event, referenceKind)
    },
  }

  return (
    <Suspense fallback={fallbackText ? <TextWithBreaksFallback text={fallbackText} /> : null}>
      <DatabaseRichTextContent {...contentProps} />
    </Suspense>
  )
}
