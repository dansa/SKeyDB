import {getOrCreateMapValue} from './cache'
import type {PublicDataScope, PublicRecord} from './contract'
import {publicRecordSchema} from './schemas'
import {assertPublicRecordForScope, assertPublicScopeCapability} from './scopeRegistry'

const recordUrls: Partial<Record<string, () => Promise<string>>> = import.meta.glob<string>(
  '../../data/public-v3/records/*/*.json',
  {
    query: '?url&no-inline',
    import: 'default',
  },
)

const testRecordModules: Partial<Record<string, () => Promise<unknown>>> =
  import.meta.glob<unknown>('../../data/public-v3/records/*/*.json', {
    import: 'default',
  })

const recordPromiseCache = new Map<string, Promise<PublicRecord | undefined>>()

function buildRecordPath(scope: PublicDataScope, id: string): string {
  return `../../data/public-v3/records/${scope}/${id}.json`
}

async function loadJsonFromRecordUrl(recordPath: string, recordUrl: string): Promise<unknown> {
  if (import.meta.env.MODE === 'test' && recordUrl.startsWith('/src/')) {
    const loadTestRecord = testRecordModules[recordPath]
    if (!loadTestRecord) {
      throw new Error(`Cannot resolve Public V3 test record URL: ${recordUrl}`)
    }
    return loadTestRecord()
  }

  const response = await fetch(recordUrl)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Public V3 record from ${recordUrl}: ${String(response.status)} ${response.statusText}`,
    )
  }
  return response.json()
}

export function loadPublicRecord(
  scope: PublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  assertPublicScopeCapability(scope, 'detailRecord')
  const cacheKey = `${scope}:${id}`
  return getOrCreateMapValue(recordPromiseCache, cacheKey, async () => {
    const recordPath = buildRecordPath(scope, id)
    const loadRecordUrl = recordUrls[recordPath]
    if (!loadRecordUrl) {
      return undefined
    }
    const recordUrl = await loadRecordUrl()
    const record = publicRecordSchema.parse(await loadJsonFromRecordUrl(recordPath, recordUrl))
    assertPublicRecordForScope(scope, record, id)
    return record
  })
}
