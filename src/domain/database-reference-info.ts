import type {AwakenerOverlayRecord} from './awakener-source-schema'
import {
  normalizeDatabaseReferenceName,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'

export function resolveDatabaseReferenceInfo(
  view: ResolvedDatabaseReferenceLayer,
  name: string,
): DatabaseReferenceInfo | null {
  return view.referenceInfoByName.get(normalizeDatabaseReferenceName(name)) ?? null
}

export function resolveDatabaseReferenceInfoById(
  view: ResolvedDatabaseReferenceLayer,
  id: string,
): DatabaseReferenceInfo | null {
  return view.referenceInfoById.get(id) ?? null
}

export function resolveDatabaseOverlay(
  view: ResolvedDatabaseReferenceLayer,
  name: string,
): AwakenerOverlayRecord | null {
  return view.overlayByName.get(normalizeDatabaseReferenceName(name)) ?? null
}
