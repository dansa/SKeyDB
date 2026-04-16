import type {DatabaseInfluenceBadge} from '@/domain/awakeners-database-view'
import type {DescribedRecord} from '@/domain/description-records'

export interface DatabaseReferenceEntry {
  name: string
  label: string
  description: string
  keywordFooterText?: string
  record?: DescribedRecord
  descriptionRank?: number
  descriptionMaxRank?: number
  influenceBadges?: DatabaseInfluenceBadge[]
  detailLinks?: {
    label: string
    entry: KeyedDatabaseReferenceEntry
  }[]
}

export type KeyedDatabaseReferenceEntry = DatabaseReferenceEntry & {key: string}
