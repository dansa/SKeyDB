import {getPublicCatalog} from './catalogRepository'
import type {PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'
import {
  assertPublicRecordForScope,
  assertPublicScopeCapability,
  type SnapshotPublicDataScope,
} from './scopeRegistry'

const recordSnapshots: Partial<Record<string, unknown>> = import.meta.glob(
  '../../data/public-v3/records/{covenants,derived-skills,enlightens,overlays,posses,relics,skills,talents,wheels}/*.json',
  {
    eager: true,
    import: 'default',
  },
)

const recordSnapshotCache = new Map<string, PublicRecord | undefined>()

function buildRecordPath(scope: SnapshotPublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

export function getPublicRecordSnapshot(
  scope: SnapshotPublicDataScope,
  id: string,
): PublicRecord | undefined {
  assertPublicScopeCapability(scope, 'snapshot')
  const cacheKey = `${scope}:${id}`
  if (recordSnapshotCache.has(cacheKey)) {
    return recordSnapshotCache.get(cacheKey)
  }

  const recordJson = recordSnapshots[buildRecordPath(scope, id)]
  if (!recordJson) {
    recordSnapshotCache.set(cacheKey, undefined)
    return undefined
  }

  const record = publicRecordSchema.parse(recordJson)
  assertPublicRecordForScope(scope, record, id)

  recordSnapshotCache.set(cacheKey, record)
  return record
}

export function getPublicRecordSnapshots(scope: SnapshotPublicDataScope): PublicRecord[] {
  assertPublicScopeCapability(scope, 'snapshot')
  return getPublicCatalog(scope).records.flatMap((record) => {
    const snapshot = getPublicRecordSnapshot(scope, record.id)
    return snapshot ? [snapshot] : []
  })
}
