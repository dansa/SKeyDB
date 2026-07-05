import type {AwakenerOverlayRecord} from './awakener-source-schema'
import {
  normalizeDatabaseReferenceName,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'

const PREFERRED_REFERENCE_IDS_BY_KIND_AND_NAME: Partial<
  Record<DatabaseReferenceInfo['kind'], Record<string, string>>
> = {
  'derived-skill': {
    'adv insight': 'derived.global.adv-insight',
    'adv. insight': 'derived.global.adv-insight',
    insight: 'derived.global.insight',
    "illusion's end": 'derived.doll-inferno.illusions-end',
  },
}

export function resolveDatabaseReferenceInfo(
  view: ResolvedDatabaseReferenceLayer,
  name: string,
): DatabaseReferenceInfo | null {
  return view.referenceInfoByName.get(normalizeDatabaseReferenceName(name)) ?? null
}

export function resolveDatabaseReferenceInfoByKindAndName(
  view: ResolvedDatabaseReferenceLayer,
  kind: DatabaseReferenceInfo['kind'],
  name: string,
): DatabaseReferenceInfo | null {
  const normalizedName = normalizeDatabaseReferenceName(name)
  const preferredId = PREFERRED_REFERENCE_IDS_BY_KIND_AND_NAME[kind]?.[normalizedName]
  const preferredReference = preferredId ? view.referenceInfoById.get(preferredId) : null
  if (
    preferredReference?.kind === kind &&
    normalizeDatabaseReferenceName(preferredReference.name) === normalizedName
  ) {
    return preferredReference
  }

  const namedReference = view.referenceInfoByName.get(normalizedName)
  if (namedReference?.kind === kind) {
    return namedReference
  }

  for (const reference of view.referenceInfoById.values()) {
    if (
      reference.kind === kind &&
      normalizeDatabaseReferenceName(reference.name) === normalizedName
    ) {
      return reference
    }
  }

  return null
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
