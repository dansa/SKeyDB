import type {PublicCatalog, PublicCatalogRecord, PublicDataScope} from './contract'
import {publicCatalogSchema} from './schemas'
import {assertPublicCatalogForScope} from './scopeRegistry'

export function createPublicCatalogReader<TScope extends PublicDataScope>(
  scope: TScope,
  catalogJson: unknown,
): {
  getCatalog: () => PublicCatalog<TScope>
  getRecords: () => PublicCatalogRecord[]
} {
  let catalogCache: PublicCatalog<TScope> | undefined

  function getCatalog(): PublicCatalog<TScope> {
    const catalog = (catalogCache ??= publicCatalogSchema.parse(
      catalogJson,
    ) as PublicCatalog<TScope>)
    assertPublicCatalogForScope(scope, catalog)
    return catalog
  }

  return {
    getCatalog,
    getRecords: () => getCatalog().records,
  }
}
