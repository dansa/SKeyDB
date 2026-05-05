import {describe, expect, it} from 'vitest'

const runtimeSourceModules = {
  ...import.meta.glob('../**/*.{ts,tsx}', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  ...import.meta.glob('../../scripts/**/*.mjs', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
} as Record<string, string>

const runtimeSourceFiles = Object.keys(runtimeSourceModules)
  .filter((filePath) => !filePath.endsWith('.test.ts'))
  .filter((filePath) => !filePath.endsWith('.test.tsx'))

const allowedPersistenceBridgeFiles = new Set([
  'src/domain/persistence-id-migration.ts',
  'src/domain/persistence-id-migration.v2.ts',
  'src/domain/collection-ownership.ts',
  'src/features/builder/builderMigrations.ts',
  'src/features/builder/builder-persistence.ts',
])

const allowedStorageVersionFiles = new Set([
  'src/features/builder/useBuilderPreferences.ts',
  'src/features/builder/BuilderSelectionControls.tsx',
  'src/features/collection/export-config.ts',
  'src/features/collection/OwnedAssetBoxExport.tsx',
  'src/features/collection/useCollectionViewModel.ts',
])

function normalizePath(filePath: string): string {
  if (filePath.startsWith('./')) {
    return `src/domain/${filePath.slice(2)}`
  }
  if (filePath.startsWith('../../')) {
    return filePath.slice(6)
  }
  if (filePath.startsWith('../')) {
    return `src/${filePath.slice(3)}`
  }
  return filePath
}

function readSource(filePath: string): string {
  return runtimeSourceModules[filePath] ?? ''
}

describe('public V2 runtime boundary', () => {
  it('normalizes sibling domain source paths from the raw glob', () => {
    expect(normalizePath('./awakener-kits.ts')).toBe('src/domain/awakener-kits.ts')
  })

  it('confines generated public JSON imports to the public-data repository boundary', () => {
    const generatedPublicDataImports = [
      'data/public-v2',
      '@/data/public-v2',
      'data/public-v3',
      '@/data/public-v3',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (normalizedPath.startsWith('src/data-access/public-data/')) {
        return []
      }

      const source = readSource(filePath)
      return generatedPublicDataImports.some((pattern) => source.includes(pattern))
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('does not import old awakener or wheel database files outside the persistence bridge', () => {
    const forbiddenImportPatterns = [
      '@/data/awakeners',
      '../data/awakeners',
      '@/data/wheels',
      '../data/wheels',
      'data/awakeners/',
      'data/wheels/',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (allowedPersistenceBridgeFiles.has(normalizedPath)) {
        return []
      }

      const source = readSource(filePath)
      return forbiddenImportPatterns.some((pattern) => source.includes(pattern))
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('keeps V1 naming confined to persistence migration code and tests', () => {
    const forbiddenRuntimeTerms = [
      'WheelFullV1Record',
      'wheels-full-v1',
      'fullDataV1',
      'compile-wheels-full-v1',
      'compileWheelsFullV1',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (
        allowedPersistenceBridgeFiles.has(normalizedPath) ||
        allowedStorageVersionFiles.has(normalizedPath)
      ) {
        return []
      }

      const source = readSource(filePath)
      return forbiddenRuntimeTerms.some((term) => source.includes(term)) ? [normalizedPath] : []
    })

    expect(offenders).toEqual([])
  })

  it('does not add public V2 runtime detail adapters', () => {
    const forbiddenRuntimeTerms = ['public-v2-detail-loaders', 'loadPublicV2']

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      const source = readSource(filePath)
      return forbiddenRuntimeTerms.some((term) => source.includes(term)) ? [normalizedPath] : []
    })

    expect(offenders).toEqual([])
  })

  it('does not keep branch-local V2 runtime detail module names or symbols', () => {
    const forbiddenRuntimeDetailTerms = [
      'fullDataV2',
      'getPublicV2UpgradeTargets',
      'awakeners-lite-v2',
      'AwakenerLiteV2Record',
      'awakenersLiteV2RecordSchema',
      'awakenersLiteV2DatasetSchema',
      'getAwakenersLiteV2',
      'awakeners-full-v2',
      'AwakenerFullV2Record',
      'PublicV2RecordUpgrade',
      'PublicV2Upgradeable',
      'getAwakenerFullV2ById',
      'awakeners-full-v2-contract',
      'awakeners-full-v2-resolver',
      'awakenerFullV2ResolveOptionsSchema',
      'AwakenerFullV2ResolveOptions',
      'ResolvedAwakenerFullV2Record',
      'resolveAwakenerFullV2Record',
      'PublicV2PatchTargetType',
      'PublicV2UpgradeableTarget',
      'wheels-full-v2',
      'WheelFullV2Record',
      'getWheelsFullV2',
      'getWheelFullV2ById',
      'posses-full-v2',
      'PosseFullV2Record',
      'getPossesFullV2',
      'getPosseFullV2ById',
      'covenants-full-v2',
      'CovenantFullV2Record',
      'getCovenantsFullV2',
    ]

    const allowlistedPaths = new Set([
      'src/domain/persistence-id-migration.v2.ts',
      'src/domain/persistence-contract.v2.json',
    ])

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (allowlistedPaths.has(normalizedPath)) {
        return []
      }

      const source = readSource(filePath)
      return forbiddenRuntimeDetailTerms.some(
        (term) => normalizedPath.includes(term) || source.includes(term),
      )
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('keeps public-v2 runtime module and path names confined to persistence history', () => {
    const allowedPublicV2NameFiles = new Set([
      'src/domain/persistence-id-migration.v2.ts',
      'src/domain/persistence-contract.v2.json',
    ])
    const generatedPublicDataImports = [
      'data/public-v2',
      '@/data/public-v2',
      '../data/public-v2',
      '../../data/public-v2',
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (allowedPublicV2NameFiles.has(normalizedPath)) {
        return []
      }

      const source = readSource(filePath)
      const sourceWithoutGeneratedDataImports = generatedPublicDataImports.reduce(
        (nextSource, pattern) => nextSource.replaceAll(pattern, ''),
        source,
      )
      return normalizedPath.includes('public-v2') ||
        sourceWithoutGeneratedDataImports.includes('public-v2')
        ? [normalizedPath]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('keeps double unknown casts out of runtime files', () => {
    const allowedDoubleCastFiles = new Set([
      // Generic sort controls bridge default option literals to caller-owned string unions.
      'src/components/ui/CollectionSortControls.tsx',
    ])

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (allowedDoubleCastFiles.has(normalizedPath)) {
        return []
      }

      const source = readSource(filePath)
      return source.includes('as unknown as') ? [normalizedPath] : []
    })

    expect(offenders).toEqual([])
  })

  it('keeps shared runtime layers independent from page modules', () => {
    const guardedRoots = [
      'src/domain/',
      'src/features/',
      'src/components/',
      'src/ui/',
      'src/data-access/',
    ]
    const pagesSegment = 'pages/'
    const pageImportPatterns = [
      `@/${pagesSegment}`,
      `src/${pagesSegment.slice(0, -1)}`,
      `../${pagesSegment}`,
      `../../${pagesSegment}`,
      `../../../${pagesSegment}`,
      `../../../../${pagesSegment}`,
    ]

    const offenders = runtimeSourceFiles.flatMap((filePath) => {
      const normalizedPath = normalizePath(filePath)
      if (!guardedRoots.some((root) => normalizedPath.startsWith(root))) {
        return []
      }

      const source = readSource(filePath)
      return pageImportPatterns.some((pattern) => source.includes(pattern)) ? [normalizedPath] : []
    })

    expect(offenders).toEqual([])
  })

  it('sources collection ownership catalog facts from public V3 repositories', () => {
    const source = readSource('./collection-ownership.ts')

    expect(source).toContain('getPublicCollectionCatalog')
    expect(source).not.toContain("from './awakeners'")
    expect(source).not.toContain("from './wheels'")
    expect(source).not.toContain("from './posses'")
  })

  it('sources builder option and lineup facts from public V3 repositories', () => {
    const builderMigrations = readSource('../features/builder/builderMigrations.ts')
    const ingameDictionaries = readSource('./ingame-token-dictionaries.ts')
    const awakenerBuilds = readSource('./awakener-builds.ts')

    expect(builderMigrations).toContain('getPublicBuilderCatalog')
    expect(builderMigrations).not.toContain('@/domain/wheels')
    expect(builderMigrations).not.toContain('@/domain/covenants')
    expect(builderMigrations).not.toContain('@/domain/posses')

    expect(ingameDictionaries).toContain('getPublicBuilderCatalog')
    expect(ingameDictionaries).not.toContain("from './awakeners'")
    expect(ingameDictionaries).not.toContain("from './wheels'")
    expect(ingameDictionaries).not.toContain("from './covenants'")
    expect(ingameDictionaries).not.toContain("from './posses'")

    expect(awakenerBuilds).toContain('getPublicBuilderCatalog')
    expect(awakenerBuilds).not.toContain('getAwakeners')
    expect(awakenerBuilds).not.toContain('getWheels')
    expect(awakenerBuilds).not.toContain('getCovenants')
    expect(awakenerBuilds).not.toContain('getPosses')
  })
})
