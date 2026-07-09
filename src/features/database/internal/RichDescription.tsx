import {lazy, Suspense, useEffect, useState} from 'react'

import type {FullStats} from '@/domain/awakener-source-schema'
import {resolveDatabaseReferenceInfoById} from '@/domain/database-reference-info'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {buildDatabaseRichDescriptionText} from '@/domain/database-rich-text'
import {resolveDescriptionTemplate} from '@/domain/description-args'
import type {DescribedRecord} from '@/domain/description-records'
import {resolveDescriptionTemplateAsync} from '@/domain/popover-resolver-client'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {usePopoverStore} from './usePopoverStore'

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

const getIsTestEnv = (): boolean => {
  if (typeof globalThis === 'undefined') return false
  const g = globalThis as Record<string, unknown>
  if (!g.process || typeof g.process !== 'object') return false
  const p = g.process as Record<string, unknown>
  if (!p.env || typeof p.env !== 'object') return false
  const e = p.env as Record<string, unknown>
  return e.NODE_ENV === 'test'
}
const isTestEnv = getIsTestEnv()

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
  const openRootOverlay = usePopoverStore((state) => state.openRootOverlay)
  const openRootReferenceByName = usePopoverStore((state) => state.openRootReferenceByName)
  const openRootInfo = usePopoverStore((state) => state.openRootInfo)

  const [resolvedSourceText, setResolvedSourceText] = useState(() => {
    if (!record) return text ?? ''
    const template = record.descriptionTemplate
    if (!template.includes('[') && !template.includes('{')) {
      return template
    }
    if (isTestEnv) {
      return resolveDescriptionTemplate(template, record.descriptionArgs, {
        rank: descriptionRank ?? skillLevel,
        stats,
        formulaContext,
      })
    }
    return ''
  })

  const currentRank = descriptionRank ?? skillLevel

  useEffect(() => {
    if (!record) {
      // No setState here — the !record case is handled as derived render value below
      return
    }
    let active = true
    if (isTestEnv) {
      const resolved = resolveDescriptionTemplate(
        record.descriptionTemplate,
        record.descriptionArgs,
        {rank: currentRank, stats, formulaContext},
      )
      void Promise.resolve(resolved).then((res) => {
        if (active) {
          setResolvedSourceText(res)
        }
      })
    } else {
      void resolveDescriptionTemplateAsync(record.descriptionTemplate, record.descriptionArgs, {
        rank: descriptionRank ?? skillLevel,
        stats,
        formulaContext,
      }).then((res) => {
        if (active) {
          setResolvedSourceText(res)
        }
      })
    }
    return () => {
      active = false
    }
  }, [record, text, descriptionRank, skillLevel, currentRank, stats, formulaContext])

  // When there's no record, derive text directly from the prop rather than going through state
  const effectiveSourceText = record ? resolvedSourceText : (text ?? '')
  const fallbackText = buildDatabaseRichDescriptionText(effectiveSourceText, keywordFooterText)
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
      openRootOverlay(overlay, event, {
        descriptionRank: descriptionRank ?? skillLevel,
        descriptionMaxRank,
        descriptionRankMode: 'current',
      })
    },
    onSkillClick: (name, event) => {
      openRootReferenceByName(name, event)
    },
    onScalingClick: (
      values,
      suffix,
      stat,
      event,
      formulas,
      currentLevel,
      finalValues,
      abstractFormula,
      arg,
      sourceRecordId,
      sourceArgKey,
    ) => {
      const refInfo =
        referenceLayer && sourceRecordId
          ? resolveDatabaseReferenceInfoById(referenceLayer, sourceRecordId)
          : null
      openRootInfo(
        {
          key: `scaling:${values.join(',')}:${suffix}:${stat ?? ''}`,
          name: stat ?? 'Lvl Scaling',
          label: '',
          description: '',
          scalingValues: values,
          scalingSuffix: suffix,
          scalingStat: stat,
          scalingFormulas: formulas,
          scalingCurrentLevel: currentLevel,
          lastDatabaseRank: refInfo?.descriptionRank ?? currentLevel,
          scalingFinalValues: finalValues,
          scalingAbstractFormula: abstractFormula,
          scalingArg: arg,
          scalingSourceRecordId: sourceRecordId,
          scalingSourceArgKey: sourceArgKey,
          descriptionRankMode: 'current',
        },
        event,
      )
    },
  }
  return (
    <Suspense fallback={fallbackText ? <TextWithBreaksFallback text={fallbackText} /> : null}>
      <DatabaseRichTextContent {...contentProps} />
    </Suspense>
  )
}
