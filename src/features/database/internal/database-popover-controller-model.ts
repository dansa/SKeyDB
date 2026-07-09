import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {
  resolveDatabaseReferenceInfo,
  resolveDatabaseReferenceInfoById,
} from '@/domain/database-reference-info'
import {
  buildDatabaseOverlayLabel,
  type DatabaseReferenceInfo,
  type DatabaseReferenceLayer,
  type ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import type {PublicDescriptionArg} from '@/domain/public-description-args'

import type {
  DatabaseReferenceNavigationTarget,
  KeyedDatabaseReferenceEntry,
} from './database-reference-entry'
import type {TrailEntry} from './popover-trail'
import type {DatabasePopoverDescriptionRankContext} from './usePopoverStore'

const LAZY_GLOBAL_REFERENCE_KINDS = new Set([
  'covenant',
  'derived-skill',
  'enlighten',
  'overlay',
  'posse',
  'skill',
  'talent',
  'wheel',
])
export interface NavigationHandlers {
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
}
export function needsLazyReferenceHydration(reference: DatabaseReferenceInfo): boolean {
  return !reference.description && LAZY_GLOBAL_REFERENCE_KINDS.has(reference.kind)
}
export function buildTrailEntry(
  reference: DatabaseReferenceInfo,
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null,
  referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
): TrailEntry {
  return {
    key: `${reference.kind}:${reference.id}`,
    referenceId: reference.id,
    name: reference.name,
    label: reference.label,
    description: reference.description,
    keywordFooterText: reference.keywordFooterText,
    record: reference.record,
    descriptionRank: reference.descriptionRank,
    descriptionMaxRank: reference.descriptionMaxRank,
    descriptionRankMode: 'static',
    influenceBadges: reference.influenceBadges,
    navigationTarget:
      reference.kind === 'skill'
        ? {kind: 'skills'}
        : reference.kind === 'wheel'
          ? {kind: 'wheel-page', wheelName: reference.name}
          : undefined,
    referenceLayerOverride,
    selectedEnlightenSlot,
    lastDatabaseRank: reference.descriptionRank,
  }
}
export function buildOverlayFallbackEntry(
  overlay: AwakenerOverlayRecord,
  referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
  rankContext: DatabasePopoverDescriptionRankContext = {},
): TrailEntry {
  return {
    key: `overlay:${overlay.id}`,
    referenceId: overlay.id,
    name: overlay.displayName,
    label: buildDatabaseOverlayLabel(overlay),
    description: overlay.descriptionTemplate,
    record: overlay,
    descriptionRank: rankContext.descriptionRank,
    descriptionMaxRank: rankContext.descriptionMaxRank,
    descriptionRankMode: rankContext.descriptionRankMode ?? 'static',
    referenceLayerOverride,
    lastDatabaseRank: rankContext.descriptionRank,
  }
}
export function resolveReferenceByName(
  layer: DatabaseReferenceLayer | null,
  name: string,
): DatabaseReferenceInfo | null {
  return layer ? resolveDatabaseReferenceInfo(layer, name) : null
}
export function resolveOverlayReference(
  layer: DatabaseReferenceLayer | null,
  overlay: AwakenerOverlayRecord,
): DatabaseReferenceInfo | null {
  return (
    (layer ? resolveDatabaseReferenceInfoById(layer, overlay.id) : null) ??
    resolveReferenceByName(layer, overlay.displayName)
  )
}
export function buildOverlayEntry({
  overlay,
  referenceLayer,
  referenceLayerOverride = null,
  rankContext = {},
  selectedEnlightenSlot,
}: {
  overlay: AwakenerOverlayRecord
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  referenceLayerOverride?: ResolvedDatabaseReferenceLayer | null
  rankContext?: DatabasePopoverDescriptionRankContext
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
}): TrailEntry {
  const info = resolveReferenceByName(referenceLayerOverride ?? referenceLayer, overlay.displayName)
  if (!info) {
    return buildOverlayFallbackEntry(overlay, referenceLayerOverride, rankContext)
  }
  return withDescriptionRankContext(
    buildTrailEntry(info, selectedEnlightenSlot, referenceLayerOverride),
    rankContext,
  )
}
export function withDescriptionRankContext<T extends TrailEntry>(
  entry: T,
  rankContext: DatabasePopoverDescriptionRankContext = {},
): T {
  if (rankContext.descriptionRank === undefined && rankContext.descriptionMaxRank === undefined) {
    return entry
  }
  return {
    ...entry,
    descriptionRank: rankContext.descriptionRank,
    descriptionMaxRank: rankContext.descriptionMaxRank,
    descriptionRankMode: rankContext.descriptionRankMode ?? entry.descriptionRankMode ?? 'static',
    lastDatabaseRank: rankContext.descriptionRank ?? entry.lastDatabaseRank,
  }
}
export function resolveLiveTrailEntry({
  entry,
  currentRankContext,
  referenceLayer,
  selectedEnlightenSlot,
}: {
  entry: TrailEntry
  currentRankContext?: DatabasePopoverDescriptionRankContext
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
}): TrailEntry {
  let liveScalingCurrentLevel = entry.scalingCurrentLevel
  let liveLastDatabaseRank = entry.lastDatabaseRank
  const liveReferenceLayer = entry.referenceLayerOverride ?? referenceLayer
  if (liveReferenceLayer && entry.scalingSourceRecordId) {
    const sourceRef = resolveDatabaseReferenceInfoById(
      liveReferenceLayer,
      entry.scalingSourceRecordId,
    )
    if (sourceRef?.descriptionRank !== undefined) {
      if (
        entry.lastDatabaseRank === undefined ||
        sourceRef.descriptionRank !== entry.lastDatabaseRank
      ) {
        liveScalingCurrentLevel =
          entry.scalingLevelStart === 0 ? sourceRef.descriptionRank - 1 : sourceRef.descriptionRank
        liveLastDatabaseRank = sourceRef.descriptionRank
      }
    }
  }

  const baseEntry = {
    ...entry,
    scalingCurrentLevel: liveScalingCurrentLevel,
    lastDatabaseRank: liveLastDatabaseRank,
  }

  const rankContext: DatabasePopoverDescriptionRankContext =
    baseEntry.descriptionRankMode === 'current'
      ? {
          descriptionRank: currentRankContext?.descriptionRank ?? baseEntry.descriptionRank,
          descriptionMaxRank:
            currentRankContext?.descriptionMaxRank ?? baseEntry.descriptionMaxRank,
          descriptionRankMode: 'current',
        }
      : {
          descriptionRank: baseEntry.descriptionRank,
          descriptionMaxRank: baseEntry.descriptionMaxRank,
          descriptionRankMode: baseEntry.descriptionRankMode ?? 'static',
        }
  if (!liveReferenceLayer || !baseEntry.referenceId) {
    return withDescriptionRankContext(baseEntry, rankContext)
  }
  const liveReference = resolveDatabaseReferenceInfoById(liveReferenceLayer, baseEntry.referenceId)
  if (!liveReference || !baseEntry.description || !liveReference.description) {
    return withDescriptionRankContext(baseEntry, rankContext)
  }
  const liveEntry = buildTrailEntry(
    liveReference,
    selectedEnlightenSlot,
    baseEntry.referenceLayerOverride ?? null,
  )
  const mergedLiveEntry = {
    ...liveEntry,
    scalingCurrentLevel: liveScalingCurrentLevel,
    lastDatabaseRank: liveLastDatabaseRank,
  }
  return liveReference.kind === 'overlay'
    ? withDescriptionRankContext(mergedLiveEntry, rankContext)
    : mergedLiveEntry
}
export function resolveNavigationHandler({
  activeEntryId,
  handlers,
  navigationTarget,
}: {
  activeEntryId: string
  handlers: NavigationHandlers
  navigationTarget?: DatabaseReferenceNavigationTarget
}): ((clearTrail: () => void) => void) | undefined {
  switch (navigationTarget?.kind) {
    case 'skills':
      return handlers.onNavigateToSkills
        ? (clearTrail) => {
            clearTrail()
            handlers.onNavigateToSkills?.()
          }
        : undefined
    case 'wheel-page':
      return handlers.onNavigateToWheelPage
        ? (clearTrail) => {
            clearTrail()
            handlers.onNavigateToWheelPage?.({
              id: activeEntryId,
              name: navigationTarget.wheelName,
            })
          }
        : undefined
    case 'covenant-page':
      return handlers.onNavigateToCovenantPage
        ? (clearTrail) => {
            clearTrail()
            handlers.onNavigateToCovenantPage?.({
              id: activeEntryId,
              name: navigationTarget.covenantName,
            })
          }
        : undefined
    default:
      return undefined
  }
}
export function withInheritedReferenceLayerOverride(
  entry: KeyedDatabaseReferenceEntry,
  sourceEntry: TrailEntry | undefined,
): TrailEntry {
  return {
    ...entry,
    referenceLayerOverride: entry.referenceLayerOverride ?? sourceEntry?.referenceLayerOverride,
  }
}

export interface BuildScalingEntryParams {
  values: number[]
  suffix: string
  stat: string | null
  formulas?: string[]
  currentLevel?: number
  levelStart?: number
  levelLabelPrefix?: string
  lastDatabaseRank?: number
  finalValues?: number[]
  abstractFormula?: string
  arg?: PublicDescriptionArg
  sourceRecordId?: string | number
  sourceArgKey?: string
  descriptionRankMode?: 'static' | 'current'
}

export function buildScalingEntry({
  values,
  suffix,
  stat,
  formulas,
  currentLevel,
  levelStart,
  levelLabelPrefix,
  lastDatabaseRank,
  finalValues,
  abstractFormula,
  arg,
  sourceRecordId,
  sourceArgKey,
  descriptionRankMode,
}: BuildScalingEntryParams): KeyedDatabaseReferenceEntry {
  return {
    key: `scaling:${values.join(',')}:${suffix}:${stat ?? ''}`,
    name: stat ?? 'Lvl Scaling',
    label: '',
    description: '',
    scalingValues: values,
    scalingSuffix: suffix,
    scalingStat: stat,
    scalingFormulas: formulas,
    scalingCurrentLevel: currentLevel,
    scalingLevelStart: levelStart,
    scalingLevelLabelPrefix: levelLabelPrefix,
    lastDatabaseRank,
    scalingFinalValues: finalValues,
    scalingAbstractFormula: abstractFormula,
    scalingArg: arg,
    scalingSourceRecordId: sourceRecordId !== undefined ? String(sourceRecordId) : undefined,
    scalingSourceArgKey: sourceArgKey,
    descriptionRankMode: descriptionRankMode ?? 'static',
  }
}
