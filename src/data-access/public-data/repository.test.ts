import {describe, expect, it} from 'vitest'

import {resolvePublicAsset, resolvePublicEntityAsset} from './assetRepository'
import {PUBLIC_DATA_SCOPES} from './contract'
import {getPublicRecordSnapshot, getPublicRecordSnapshots} from './recordSnapshots'
import {resolvePublicReferenceToken} from './referenceRepository'
import {
  getPublicBuilderCatalog,
  getPublicCatalog,
  getPublicCollectionCatalog,
  getPublicEntity,
  getPublicManifest,
  loadPublicRecord,
} from './repository'
import {getPublicRoutesIndex, resolvePublicRoute} from './routeResolver'
import {
  getPublicScopeDescriptor,
  type SearchablePublicDataScope,
  type SnapshotPublicDataScope,
} from './scopeRegistry'
import {getPublicSearchDocuments} from './searchRepository'

describe('public-data repository', () => {
  it('loads and validates the V3 manifest and small catalogs', () => {
    const manifest = getPublicManifest()
    const covenants = getPublicCatalog('covenants')
    const posses = getPublicCatalog('posses')

    expect(manifest.schemaVersion).toBe(3)
    expect(manifest.scopes.covenants.count).toBe(covenants.records.length)
    expect(manifest.scopes.posses.count).toBe(posses.records.length)
    expect(covenants.records[0]).toMatchObject({
      kind: 'covenant',
      id: 'covenant-0001',
      route: {canonicalPath: '/database/covenants/deus-ex-machina'},
    })
    expect(posses.records[0]).toMatchObject({
      kind: 'posse',
      id: 'posse-0001',
      route: {canonicalPath: '/database/posses/encounter-in-pure-white'},
    })
  })

  it('lazy-loads V3 detail records by scope and id', async () => {
    await expect(loadPublicRecord('covenants', 'covenant-0001')).resolves.toMatchObject({
      schemaVersion: 3,
      kind: 'covenant',
      id: 'covenant-0001',
      setEffects: [{set: 3}, {set: 6}],
    })
    await expect(loadPublicRecord('posses', 'posse-0001')).resolves.toMatchObject({
      schemaVersion: 3,
      kind: 'posse',
      id: 'posse-0001',
      descriptionTemplate: 'Discard your hand, then draw that many cards plus 2.',
    })
    await expect(loadPublicRecord('posses', 'posse-9999')).resolves.toBeUndefined()
  })

  it('resolves canonical routes through the generated route index', () => {
    expect(resolvePublicRoute('awakeners', '24')).toEqual({
      status: 'ok',
      ref: {kind: 'awakener', id: 'awakener-0001'},
      canonicalPath: '/database/awakeners/24',
    })
    expect(resolvePublicRoute('covenants', 'deus-ex-machina')).toEqual({
      status: 'ok',
      ref: {kind: 'covenant', id: 'covenant-0001'},
      canonicalPath: '/database/covenants/deus-ex-machina',
    })
    expect(resolvePublicRoute('posses', 'missing-posse')).toEqual({
      status: 'notFound',
      scope: 'posses',
      slug: 'missing-posse',
    })
  })

  it('exposes generated entity, reference, search, asset, builder, and collection indexes', () => {
    expect(getPublicEntity('awakener-0001')).toMatchObject({
      kind: 'awakener',
      id: 'awakener-0001',
      route: {canonicalPath: '/database/awakeners/24'},
    })
    expect(resolvePublicReferenceToken('deus ex machina')).toEqual([
      {kind: 'covenant', id: 'covenant-0001'},
    ])
    expect(getPublicSearchDocuments('posses')[0]).toMatchObject({
      kind: 'posse',
      id: expect.stringMatching(/^posse-\d{4}$/),
    })
    expect(getPublicSearchDocuments('covenants')[0]).toMatchObject({
      kind: 'covenant',
      id: expect.stringMatching(/^covenant-\d{4}$/),
    })
    expect(getPublicSearchDocuments('relics')[0]).toMatchObject({
      kind: 'relic',
      id: expect.stringMatching(/^relic-\d{4}$/),
    })
    expect(getPublicSearchDocuments('awakeners')[0]).toMatchObject({
      kind: 'awakener',
      facets: {tags: expect.arrayContaining(['hand-limit'])},
    })

    const assetId = resolvePublicEntityAsset('posse-0001', 'icon')
    expect(assetId).toBe('asset-posse-0001-icon')
    expect(resolvePublicAsset(assetId ?? '')).toMatchObject({
      id: 'asset-posse-0001-icon',
      ownerId: 'posse-0001',
      slot: 'icon',
    })

    expect(getPublicBuilderCatalog().options.awakeners).toContain('awakener-0001')
    expect(getPublicCollectionCatalog().collectables.posses).toContain('posse-0001')
  })

  it('exposes repository-confined synchronous snapshots for legacy detail tables', () => {
    expect(getPublicRecordSnapshot('skills', 'skill.thais.ancient-caress')).toMatchObject({
      schemaVersion: 3,
      kind: 'skill',
      id: 'skill.thais.ancient-caress',
      ownerAwakenerId: 'awakener-0048',
    })
    expect(getPublicRecordSnapshots('overlays').length).toBeGreaterThan(0)
    expect(getPublicRecordSnapshot('wheels', 'wheel-0001')).toMatchObject({
      kind: 'wheel',
      id: 'wheel-0001',
      descriptionTemplate: expect.stringContaining('Hand Limit'),
    })
  })

  it('rejects public-data scopes without search support instead of returning an empty index', () => {
    const unsupportedSearchScope = 'skills' as SearchablePublicDataScope

    expect(() => getPublicSearchDocuments(unsupportedSearchScope)).toThrow(
      'Public V3 scope "skills" does not support search indexes.',
    )
  })

  it('rejects public-data scopes without synchronous snapshot support', () => {
    const unsupportedSnapshotScope = 'awakeners' as SnapshotPublicDataScope

    expect(() => getPublicRecordSnapshots(unsupportedSnapshotScope)).toThrow(
      'Public V3 scope "awakeners" does not support synchronous record snapshots.',
    )
  })

  it('keeps manifest, catalog, route, and search invariants aligned with scope descriptors', () => {
    const manifest = getPublicManifest()
    const searchableScopes = PUBLIC_DATA_SCOPES.filter(
      (scope): scope is SearchablePublicDataScope =>
        getPublicScopeDescriptor(scope).capabilities.includes('search'),
    )

    for (const scope of PUBLIC_DATA_SCOPES) {
      const descriptor = getPublicScopeDescriptor(scope)
      const catalog = getPublicCatalog(scope)

      expect(catalog.scope).toBe(scope)
      expect(catalog.kind).toBe(descriptor.kind)
      expect(catalog.records).toHaveLength(manifest.scopes[scope].count)

      for (const record of catalog.records) {
        expect(record.kind).toBe(descriptor.kind)
        expect(record.id.startsWith(descriptor.idPrefix)).toBe(true)

        expect(descriptor.hasRouteIndex).toBe(true)
      }

      const routeEntries = Object.values(getPublicRoutesIndex().routes[scope] ?? {})
      expect(routeEntries).toHaveLength(catalog.records.length)
      expect(routeEntries.map((entry) => [entry.kind, entry.id]).sort()).toEqual(
        catalog.records.map((record) => [record.kind, record.id]).sort(),
      )
    }

    for (const scope of searchableScopes) {
      const descriptor = getPublicScopeDescriptor(scope)
      for (const document of getPublicSearchDocuments(scope)) {
        expect(document.kind).toBe(descriptor.kind)
        expect(document.id.startsWith(descriptor.idPrefix)).toBe(true)
      }
    }
  })
})
