import type {Awakener} from '@/domain/awakeners'
import {DEFAULT_REALM_ACCENT, getRealmAccent} from '@/domain/realms'
import {getRelicDatabaseCategoryFilterLabel} from '@/domain/relic-database-browse-state'
import type {PublicRelicVariant, Relic, RelicCategory} from '@/domain/relics'

export function buildRelicVariantLabels(
  variants: readonly Pick<PublicRelicVariant, 'id' | 'label' | 'name'>[],
): Map<string, string> {
  const totals = new Map<string, number>()
  const ordinals = new Map<string, number>()
  const labels = new Map<string, string>()

  for (const variant of variants) {
    totals.set(variant.label, (totals.get(variant.label) ?? 0) + 1)
  }
  for (const variant of variants) {
    const ordinal = (ordinals.get(variant.label) ?? 0) + 1
    ordinals.set(variant.label, ordinal)
    const total = totals.get(variant.label) ?? 1
    labels.set(
      variant.id,
      total === 1 ? variant.label : `${variant.label} — Variant ${ordinal.toString()}`,
    )
  }

  return labels
}

export function getRelicVariantTypeLabel(variantType: string): string {
  return variantType
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const RELIC_CATEGORY_ACCENTS: Record<RelicCategory, string> = {
  ASTRAL_REIGN: '#d8b25f',
  FADED_LEGACY: '#8fa6c2',
  DIMENSIONAL_IMAGE: DEFAULT_REALM_ACCENT,
  EVENT: '#b28ad6',
  PENDULUM: '#78a9d4',
  OTHER: '#8995a7',
}

export function getRelicPrimaryCategory(relic: Relic): RelicCategory {
  return relic.categories[0] ?? 'OTHER'
}

export function getRelicCardAccent(relic: Relic, awakeners: readonly Awakener[]): string {
  if (getRelicPrimaryCategory(relic) === 'DIMENSIONAL_IMAGE' && relic.ownerAwakenerId) {
    const owner = awakeners.find((awakener) => awakener.id === relic.ownerAwakenerId)
    if (owner) {
      return getRealmAccent(owner.realm)
    }
  }
  return RELIC_CATEGORY_ACCENTS[getRelicPrimaryCategory(relic)]
}

export function getRelicCategoryLabel(category: RelicCategory): string {
  return getRelicDatabaseCategoryFilterLabel(category)
}

export function formatRelicCardMeta(relic: Relic): string {
  return [relic.rarity, relic.categories.map(getRelicCategoryLabel).join(' · ')]
    .filter(Boolean)
    .join(' · ')
}
