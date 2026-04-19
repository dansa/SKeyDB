import type {AwakenerOverlayRecord} from './awakener-source-schema'
import type {ResolvedAwakenerDatabaseReferenceLayer} from './awakeners-database-view'
import {
  resolveDatabaseOverlay,
  resolveDatabaseReferenceInfo,
  resolveDatabaseReferenceInfoById,
} from './database-reference-info'
import type {DatabaseReferenceInfo} from './database-reference-layer'

export {buildDatabaseOverlayLabel as buildAwakenerDatabaseOverlayLabel} from './database-reference-layer'

export function resolveAwakenerDatabaseReferenceInfo(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  name: string,
): DatabaseReferenceInfo | null {
  return resolveDatabaseReferenceInfo(view, name)
}

export function resolveAwakenerDatabaseReferenceInfoById(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  id: string,
): DatabaseReferenceInfo | null {
  return resolveDatabaseReferenceInfoById(view, id)
}

export function resolveAwakenerDatabaseOverlay(
  view: ResolvedAwakenerDatabaseReferenceLayer,
  name: string,
): AwakenerOverlayRecord | null {
  return resolveDatabaseOverlay(view, name)
}
