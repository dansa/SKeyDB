import {useMemo} from 'react'

import type {AwakenerEnlightenRecord, FullStats} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import {resolveWheelMainstatValue} from '@/domain/wheel-mainstat-scaling'
import {getWheelById, type Wheel} from '@/domain/wheels'

import {type KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {buildPopoverHeader} from './DatabaseReferencePopoverHeaders'
import {
  getPopoverWidthClass,
  getRelatedReferences,
  isSkillEntryKey,
  isTagOverlay,
  useResolvedDescriptionFallbackText,
} from './DatabaseReferencePopoverHelpers'
import type {PopoverHeaderModel} from './popover-header-model'
import {useOverlayIcon} from './useOverlayIcon'
import {usePopoverScalingData} from './usePopoverScalingData'

export interface ResolvedPopoverVisualData {
  key: string
  entry: KeyedDatabaseReferenceEntry
  isWheel: boolean
  isScaling: boolean
  isTag: boolean
  isSkill: boolean
  widthClass: string
  depth: number
  totalDepth: number
  header: PopoverHeaderModel | null
  fallbackText: string
  attributeRows: import('./database-reference-entry').DatabaseReferenceAttributeRow[]
  descriptionSections: NonNullable<KeyedDatabaseReferenceEntry['descriptionSections']>
  detailLinks: NonNullable<KeyedDatabaseReferenceEntry['detailLinks']>
  relatedReferences: DatabaseReferenceInfo[]
  wheel: Wheel | null
  wheelValues: number[]
  wheelSuffix: string
  scalingData: {
    refInfo: DatabaseReferenceInfo | null
    liveFormulas: string[] | undefined
    liveFinalValues: number[] | undefined
    liveAbstractFormula: string | undefined
    liveAbstractFormulaExplanations:
      | {label: string; value: string; sourceName?: string}[]
      | undefined
    shouldCeil: boolean
    originalValues: number[]
  }
  activeLevel: number
  scalingLevelStart?: number
  scalingLevelLabelPrefix?: string
}

interface UseResolvedPopoverVisualDataOptions {
  entry: KeyedDatabaseReferenceEntry
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext: PublicFormulaContext | null
  stats: FullStats | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  depth: number
  totalDepth: number
  onNavigate?: () => void
  onClose: () => void
  onSkillTokenClick: (name: string, event?: import('react').MouseEvent) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  simplifyPopoverMultiplier?: boolean
}

export function useResolvedPopoverVisualData({
  entry,
  referenceLayer,
  formulaContext,
  stats,
  selectedEnlightenSlot,
  depth,
  totalDepth,
  onNavigate,
  onClose,
  onSkillTokenClick,
  onToggleEnlightenSlot,
  simplifyPopoverMultiplier = false,
}: UseResolvedPopoverVisualDataOptions): ResolvedPopoverVisualData {
  const isWheel = entry.key.startsWith('wheel')
  const record = entry.record
  const wheel = useMemo(() => {
    if (!isWheel || !record?.id) return null
    return getWheelById(record.id) ?? null
  }, [isWheel, record])

  const wheelValues = useMemo(() => {
    if (!isWheel || !wheel) return []
    const seriesKey = `${wheel.rarity}:${wheel.mainstatKey}`
    return Array.from({length: 13}, (_, i) => {
      const level = i + 3
      try {
        const strVal = resolveWheelMainstatValue(seriesKey, level)
        return parseFloat(strVal)
      } catch {
        return 0
      }
    })
  }, [isWheel, wheel])

  const wheelSuffix = useMemo(() => {
    if (!isWheel || !wheel) return ''
    const seriesKey = `${wheel.rarity}:${wheel.mainstatKey}`
    try {
      const strVal = resolveWheelMainstatValue(seriesKey, 3)
      const match = /[^\d.]+$/.exec(strVal)
      return match ? match[0] : ''
    } catch {
      return ''
    }
  }, [isWheel, wheel])

  const activeLevel = entry.scalingCurrentLevel ?? entry.descriptionRank ?? 0

  const relatedReferences = useMemo(
    () => getRelatedReferences(referenceLayer, entry.record),
    [referenceLayer, entry.record],
  )
  const detailLinks = useMemo(() => entry.detailLinks ?? [], [entry.detailLinks])
  const descriptionSections = useMemo(
    () => entry.descriptionSections ?? [],
    [entry.descriptionSections],
  )
  const attributeRows = useMemo(() => entry.attributeRows ?? [], [entry.attributeRows])

  const fallbackText = useResolvedDescriptionFallbackText({
    description: entry.description,
    formulaContext: formulaContext ?? undefined,
    keywordFooterText: entry.keywordFooterText,
    rank: entry.descriptionRank,
    record: entry.record,
    stats,
  })

  const isScaling = Boolean(entry.scalingValues)
  const isTag = isTagOverlay(record)
  const isSkill =
    isSkillEntryKey(entry.key) || Boolean(entry.influenceBadges && entry.influenceBadges.length > 0)
  const tagRecord = isTag ? record : null
  const iconUrl = useOverlayIcon(tagRecord?.iconId ?? null)

  const scalingResult = usePopoverScalingData({
    entry,
    referenceLayer,
    selectedEnlightenSlot,
    stats,
    formulaContext: formulaContext ?? undefined,
    activeLevel,
    simplifyPopoverMultiplier,
  })

  const header = useMemo(() => {
    return buildPopoverHeader({
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
      onOpenReferenceName: onSkillTokenClick,
      sourceName: scalingResult.refInfo?.name ?? null,
      referenceLayer,
    })
  }, [
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
    onSkillTokenClick,
    scalingResult.refInfo?.name,
    referenceLayer,
  ])

  const widthClass = useMemo(() => getPopoverWidthClass(entry), [entry])

  return {
    key: entry.key,
    entry,
    isWheel,
    isScaling,
    isTag,
    isSkill,
    widthClass,
    depth,
    totalDepth,
    header,
    fallbackText,
    attributeRows,
    descriptionSections,
    detailLinks,
    relatedReferences,
    wheel,
    wheelValues,
    wheelSuffix,
    scalingData: {
      refInfo: scalingResult.refInfo,
      liveFormulas: scalingResult.liveFormulas,
      liveFinalValues: scalingResult.liveFinalValues,
      liveAbstractFormula: scalingResult.liveAbstractFormula,
      liveAbstractFormulaExplanations: scalingResult.liveAbstractFormulaExplanations,
      shouldCeil: scalingResult.shouldCeil,
      originalValues: scalingResult.originalValues,
    },
    activeLevel,
    scalingLevelStart: entry.scalingLevelStart,
    scalingLevelLabelPrefix: entry.scalingLevelLabelPrefix,
  }
}
