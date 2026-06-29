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

export interface DatabaseReferenceLabelSegment {
  text: string
  tone?: 'default' | 'value'
}

export interface DatabaseReferenceThumbnail {
  alt?: string
  src: string
}

export type DatabaseReferenceNavigationTarget =
  | {kind: 'skills'}
  | {kind: 'wheel-page'; wheelId?: string; wheelName: string}
  | {kind: 'covenant-page'; covenantName: string}

export interface DatabaseReferenceEntry {
  name: string
  label: string
  labelSegments?: DatabaseReferenceLabelSegment[]
  description: string
  keywordFooterText?: string
  record?: DescribedRecord
  descriptionRank?: number
  descriptionMaxRank?: number
  descriptionRankMode?: 'static' | 'current'
  influenceBadges?: DatabaseInfluenceBadge[]
  attributeRows?: DatabaseReferenceAttributeRow[]
  thumbnail?: DatabaseReferenceThumbnail
  detailLinks?: {
    label: string
    entry: KeyedDatabaseReferenceEntry
  }[]
  descriptionSections?: {
    label: string
    description: string
    record?: DescribedRecord
    tone?: 'default' | 'lore'
  }[]
  navigationLabel?: string
  navigationTarget?: DatabaseReferenceNavigationTarget
  referenceLayerOverride?: ResolvedDatabaseReferenceLayer | null
}

export type KeyedDatabaseReferenceEntry = DatabaseReferenceEntry & {key: string}
