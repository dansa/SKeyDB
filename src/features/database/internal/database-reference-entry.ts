import type {
  DatabaseInfluenceBadge,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import type {DescribedRecord} from '@/domain/description-records'
import type {PublicDescriptionArg} from '@/domain/public-description-args'

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
  scalingValues?: number[]
  scalingSuffix?: string
  scalingStat?: string | null
  scalingCurrentLevel?: number
  scalingLevelLabelPrefix?: string
  scalingLevelStart?: number
  scalingFormulas?: string[]
  scalingFinalValues?: number[]
  scalingAbstractFormula?: string
  scalingArg?: PublicDescriptionArg
  scalingSourceRecordId?: string
  scalingSourceArgKey?: string
  lastDatabaseRank?: number
}
export type KeyedDatabaseReferenceEntry = DatabaseReferenceEntry & {key: string}
