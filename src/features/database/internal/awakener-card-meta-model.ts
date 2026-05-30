import {
  getAwakenerScalingSubstatIcon,
  getAwakenerScalingSubstatLabel,
  inferAwakenerScalingSubstatRole,
  type AwakenerScalingSubstatRole,
} from '@/domain/awakener-scaling-substats'
import {SUBSTAT_SCALING_KEYS, type SubstatScalingKey} from '@/domain/awakener-source-schema'
import type {Awakener} from '@/domain/awakeners'
import type {
  AvailabilityFilterId,
  AwakenerScalingSubstatFilter,
  RarityFilterId,
} from '@/domain/database-browse-state'
import type {DatabaseSortKey} from '@/domain/database-sorting'

export type AwakenerCardMetaIntent = 'none' | 'scaling' | 'release-date' | 'rarity-source'

export interface AwakenerScalingCardMetaEntry {
  icon: string | undefined
  key: SubstatScalingKey
  label: string
  role: AwakenerScalingSubstatRole
  roleLabel: string
}

export type AwakenerCardMetaData =
  | {
      ariaLabel: string
      entries: AwakenerScalingCardMetaEntry[]
      kind: 'scaling'
    }
  | {
      kind: 'text'
      label: string
    }

export interface AwakenerCardMetaContext {
  availabilityFilter: AvailabilityFilterId
  rarityFilter: RarityFilterId
  scalingSubstatFilters: readonly AwakenerScalingSubstatFilter[]
  sortKey: DatabaseSortKey
}

export const DEFAULT_AWAKENER_CARD_META_CONTEXT = {
  availabilityFilter: 'ALL',
  rarityFilter: 'ALL',
  scalingSubstatFilters: [],
  sortKey: 'BEST_MATCH',
} satisfies AwakenerCardMetaContext

const SCALING_ROLE_LABELS = {
  MAIN: 'Primary',
  SUB: 'Secondary',
} satisfies Record<AwakenerScalingSubstatRole, string>

const SCALING_ROLE_ORDER = {
  MAIN: 0,
  SUB: 1,
} satisfies Record<AwakenerScalingSubstatRole, number>

const RELEASE_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function resolveAwakenerCardMetaIntent({
  availabilityFilter,
  rarityFilter,
  scalingSubstatFilters,
  sortKey,
}: AwakenerCardMetaContext): AwakenerCardMetaIntent {
  if (scalingSubstatFilters.length > 0) {
    return 'scaling'
  }
  if (sortKey === 'RELEASE_DATE') {
    return 'release-date'
  }
  if (sortKey === 'RARITY' || rarityFilter !== 'ALL' || availabilityFilter !== 'ALL') {
    return 'rarity-source'
  }
  return 'none'
}

function formatReleaseDate(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  const parsedDate = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }
  return RELEASE_DATE_FORMATTER.format(parsedDate)
}

function getAvailabilitySourceLabel(value: string | undefined): string | null {
  const normalized = value?.trim().toUpperCase()
  if (!normalized) {
    return null
  }
  if (normalized === 'PERMANENT') {
    return 'Permanent'
  }
  if (normalized === 'WELFARE') {
    return 'Welfare'
  }
  if (normalized.startsWith('LIMITED')) {
    return 'Limited'
  }
  return value ?? null
}

function getLimitedSourceDetailLabel(value: string | undefined): string | null {
  const normalized = value?.trim().toUpperCase()
  if (normalized === 'LIMITED_ASTRAL_REIGN') {
    return 'Astral Reign'
  }
  if (normalized === 'LIMITED_FADED_LEGACY') {
    return 'Faded Legacy'
  }
  return null
}

function isExactSourceFilter(availabilityFilter: AvailabilityFilterId): boolean {
  return (
    availabilityFilter === 'LIMITED_ASTRAL_REIGN' || availabilityFilter === 'LIMITED_FADED_LEGACY'
  )
}

function shouldShowRarity(awakener: Awakener, context: AwakenerCardMetaContext): boolean {
  if (context.rarityFilter !== 'ALL') {
    return false
  }
  if (context.availabilityFilter === 'LIMITED_ASTRAL_REIGN') {
    return false
  }
  return Boolean(awakener.rarity?.trim())
}

function shouldShowAvailabilityGroup(context: AwakenerCardMetaContext): boolean {
  return context.availabilityFilter === 'ALL'
}

function shouldShowLimitedSourceDetail(
  context: AwakenerCardMetaContext,
  detailLabel: string | null,
): boolean {
  return detailLabel !== null && !isExactSourceFilter(context.availabilityFilter)
}

function getRaritySourceLabel(awakener: Awakener, context: AwakenerCardMetaContext): string | null {
  const rarity = awakener.rarity?.trim()
  const normalizedRarity = rarity?.toUpperCase()
  if (normalizedRarity === 'GENESIS') {
    return context.rarityFilter === 'Genesis' ? null : 'UR · Genesis'
  }

  const parts: string[] = []
  if (rarity && shouldShowRarity(awakener, context)) {
    parts.push(rarity)
  }

  const source = getAvailabilitySourceLabel(awakener.availabilityType)
  if (source && shouldShowAvailabilityGroup(context)) {
    parts.push(source)
  }

  const detail = getLimitedSourceDetailLabel(awakener.availabilityType)
  if (detail && shouldShowLimitedSourceDetail(context, detail)) {
    parts.push(detail)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

function getScalingMetaEntries(awakener: Awakener): AwakenerScalingCardMetaEntry[] {
  return SUBSTAT_SCALING_KEYS.flatMap((key) => {
    const role = inferAwakenerScalingSubstatRole(awakener.substatScaling, key)
    if (!role) {
      return []
    }
    return [
      {
        icon: getAwakenerScalingSubstatIcon(key),
        key,
        label: getAwakenerScalingSubstatLabel(key),
        role,
        roleLabel: SCALING_ROLE_LABELS[role],
      },
    ]
  }).sort((left, right) => SCALING_ROLE_ORDER[left.role] - SCALING_ROLE_ORDER[right.role])
}

function getScalingMetaData(awakener: Awakener): AwakenerCardMetaData | null {
  const entries = getScalingMetaEntries(awakener)
  if (entries.length === 0) {
    return null
  }
  return {
    ariaLabel: entries.map((entry) => `${entry.roleLabel} scaling: ${entry.label}`).join('; '),
    entries,
    kind: 'scaling',
  }
}

export function getAwakenerCardMetaData(
  awakener: Awakener,
  context: AwakenerCardMetaContext = DEFAULT_AWAKENER_CARD_META_CONTEXT,
): AwakenerCardMetaData | null {
  const intent = resolveAwakenerCardMetaIntent(context)
  if (intent === 'scaling') {
    return getScalingMetaData(awakener)
  }
  if (intent === 'release-date') {
    const label = formatReleaseDate(awakener.releaseDate)
    return label ? {kind: 'text', label} : null
  }
  if (intent === 'rarity-source') {
    const label = getRaritySourceLabel(awakener, context)
    return label ? {kind: 'text', label} : null
  }
  return null
}
