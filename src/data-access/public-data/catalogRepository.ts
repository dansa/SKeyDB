import awakenerBuildsCatalogJson from '@/data/public-v3/catalogs/awakener-builds.json'
import awakenersCatalogJson from '@/data/public-v3/catalogs/awakeners.json'
import covenantsCatalogJson from '@/data/public-v3/catalogs/covenants.json'
import derivedSkillsCatalogJson from '@/data/public-v3/catalogs/derived-skills.json'
import enlightensCatalogJson from '@/data/public-v3/catalogs/enlightens.json'
import overlaysCatalogJson from '@/data/public-v3/catalogs/overlays.json'
import possesCatalogJson from '@/data/public-v3/catalogs/posses.json'
import relicsCatalogJson from '@/data/public-v3/catalogs/relics.json'
import skillsCatalogJson from '@/data/public-v3/catalogs/skills.json'
import talentsCatalogJson from '@/data/public-v3/catalogs/talents.json'
import wheelsCatalogJson from '@/data/public-v3/catalogs/wheels.json'

import {getOrCreateMapValue} from './cache'
import {
  PUBLIC_DATA_SCOPES,
  type PublicCatalog,
  type PublicCatalogRecord,
  type PublicDataScope,
} from './contract'
import {publicCatalogSchema} from './schemas'
import {assertPublicCatalogForScope} from './scopeRegistry'

const catalogJsonByScope = {
  'awakener-builds': awakenerBuildsCatalogJson,
  awakeners: awakenersCatalogJson,
  covenants: covenantsCatalogJson,
  'derived-skills': derivedSkillsCatalogJson,
  enlightens: enlightensCatalogJson,
  overlays: overlaysCatalogJson,
  posses: possesCatalogJson,
  relics: relicsCatalogJson,
  skills: skillsCatalogJson,
  talents: talentsCatalogJson,
  wheels: wheelsCatalogJson,
} satisfies Record<PublicDataScope, unknown>

const catalogCache = new Map<PublicDataScope, PublicCatalog>()

export function getPublicCatalog(scope: PublicDataScope): PublicCatalog {
  return getOrCreateMapValue(catalogCache, scope, () => {
    const catalog = publicCatalogSchema.parse(catalogJsonByScope[scope])
    assertPublicCatalogForScope(scope, catalog)
    return catalog
  })
}

export function getPublicCatalogRecords(scope: PublicDataScope): PublicCatalogRecord[] {
  return getPublicCatalog(scope).records
}

export function getPublicCatalogRecordById(entityId: string): PublicCatalogRecord | undefined {
  for (const scope of PUBLIC_DATA_SCOPES) {
    const record = getPublicCatalogRecords(scope).find((entry) => entry.id === entityId)
    if (record) {
      return record
    }
  }
  return undefined
}
