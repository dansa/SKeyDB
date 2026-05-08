import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'
import {assertPublicRecordForScope, assertPublicScopeCapability} from './scopeRegistry'

type JsonLoader = () => Promise<unknown>

const recordLoaders: Partial<Record<string, JsonLoader>> = import.meta.glob(
  '../../data/public-v3/records/*/*.json',
  {
    import: 'default',
  },
)

const recordPromiseCache = new Map<string, Promise<PublicRecord | undefined>>()

function buildRecordPath(scope: PublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

export function loadPublicRecord(
  scope: PublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  assertPublicScopeCapability(scope, 'detailRecord')
  const cacheKey = `${scope}:${id}`
  return getOrCreateMapValue(recordPromiseCache, cacheKey, async () => {
    const loader = recordLoaders[buildRecordPath(scope, id)]
    if (!loader) {
      return undefined
    }
    const record = publicRecordSchema.parse(await loader())
    assertPublicRecordForScope(scope, record, id)
    return record
  })
}
