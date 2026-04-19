import type {
  DatabaseInfluenceBadge,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import type {DescribedRecord} from '@/domain/description-records'

export interface DatabaseReferenceAttributeRow {
  iconSrc?: string
  label: string
  value: string
}

export type DatabaseReferenceNavigationTarget =
  | {kind: 'cards'}
  | {kind: 'wheel-page'; wheelName: string}

export interface DatabaseReferenceEntry {
  name: string
  label: string
  description: string
  keywordFooterText?: string
  record?: DescribedRecord
  descriptionRank?: number
  descriptionMaxRank?: number
  influenceBadges?: DatabaseInfluenceBadge[]
  attributeRows?: DatabaseReferenceAttributeRow[]
  detailLinks?: {
    label: string
    entry: KeyedDatabaseReferenceEntry
  }[]
  navigationLabel?: string
  navigationTarget?: DatabaseReferenceNavigationTarget
  referenceLayerOverride?: ResolvedDatabaseReferenceLayer | null
}

export type KeyedDatabaseReferenceEntry = DatabaseReferenceEntry & {key: string}
