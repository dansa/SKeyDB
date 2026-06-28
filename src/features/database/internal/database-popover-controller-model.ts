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

import type {DatabasePopoverDescriptionRankContext} from './database-popover-context'
import type {
  DatabaseReferenceNavigationTarget,
  KeyedDatabaseReferenceEntry,
} from './database-reference-entry'
import type {TrailEntry} from './popover-trail'

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
  const rankContext: DatabasePopoverDescriptionRankContext =
    entry.descriptionRankMode === 'current'
      ? {
          descriptionRank: currentRankContext?.descriptionRank ?? entry.descriptionRank,
          descriptionMaxRank: currentRankContext?.descriptionMaxRank ?? entry.descriptionMaxRank,
          descriptionRankMode: 'current',
        }
      : {
          descriptionRank: entry.descriptionRank,
          descriptionMaxRank: entry.descriptionMaxRank,
          descriptionRankMode: entry.descriptionRankMode ?? 'static',
        }
  const liveReferenceLayer = entry.referenceLayerOverride ?? referenceLayer
  if (!liveReferenceLayer || !entry.referenceId) {
    return withDescriptionRankContext(entry, rankContext)
  }

  const liveReference = resolveDatabaseReferenceInfoById(liveReferenceLayer, entry.referenceId)
  if (!liveReference || !entry.description || !liveReference.description) {
    return withDescriptionRankContext(entry, rankContext)
  }

  const liveEntry = buildTrailEntry(
    liveReference,
    selectedEnlightenSlot,
    entry.referenceLayerOverride ?? null,
  )
  return liveReference.kind === 'overlay'
    ? withDescriptionRankContext(liveEntry, rankContext)
    : liveEntry
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
    referenceId: inferReferenceIdFromEntryKey(entry.key),
    referenceLayerOverride: entry.referenceLayerOverride ?? sourceEntry?.referenceLayerOverride,
  }
}

function inferReferenceIdFromEntryKey(key: string): string | undefined {
  const separatorIndex = key.indexOf(':')
  if (separatorIndex <= 0 || separatorIndex >= key.length - 1) {
    return undefined
  }
  return key.slice(separatorIndex + 1)
}
