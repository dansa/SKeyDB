import {getPublicAwakenerBuildCatalog} from '../catalogScopes/awakenerBuildsCatalog'
import {getPublicAwakenerCatalog} from '../catalogScopes/awakenersCatalog'
import {getPublicCovenantCatalog} from '../catalogScopes/covenantsCatalog'
import {getPublicDerivedSkillCatalog} from '../catalogScopes/derivedSkillsCatalog'
import {getPublicEnlightenCatalog} from '../catalogScopes/enlightensCatalog'
import {getPublicOverlayCatalog} from '../catalogScopes/overlaysCatalog'
import {getPublicPosseCatalog} from '../catalogScopes/possesCatalog'
import {getPublicRelicCatalog} from '../catalogScopes/relicsCatalog'
import {getPublicSkillCatalog} from '../catalogScopes/skillsCatalog'
import {getPublicTalentCatalog} from '../catalogScopes/talentsCatalog'
import {getPublicWheelCatalog} from '../catalogScopes/wheelsCatalog'
import type {PublicCatalog, PublicCatalogRecord, PublicDataScope} from '../contract'

/**
 * Test-only access to every generated catalog. Production code should depend on
 * the concrete scope reader it owns instead of importing an all-scope facade.
 */
const TEST_PUBLIC_CATALOG_READERS = {
  'awakener-builds': getPublicAwakenerBuildCatalog,
  awakeners: getPublicAwakenerCatalog,
  covenants: getPublicCovenantCatalog,
  'derived-skills': getPublicDerivedSkillCatalog,
  enlightens: getPublicEnlightenCatalog,
  overlays: getPublicOverlayCatalog,
  posses: getPublicPosseCatalog,
  relics: getPublicRelicCatalog,
  skills: getPublicSkillCatalog,
  talents: getPublicTalentCatalog,
  wheels: getPublicWheelCatalog,
} satisfies Record<PublicDataScope, () => PublicCatalog>

export function getTestPublicCatalog(scope: PublicDataScope): PublicCatalog {
  return TEST_PUBLIC_CATALOG_READERS[scope]()
}

export function getTestPublicCatalogRecords(scope: PublicDataScope): PublicCatalogRecord[] {
  return getTestPublicCatalog(scope).records
}
