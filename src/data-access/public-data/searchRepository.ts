import {awakenerSearchDocumentRepository} from './awakenerSearchRepository'
import type {PublicSearchDocument} from './contract'
import {covenantSearchDocumentRepository} from './covenantSearchRepository'
import {posseSearchDocumentRepository} from './posseSearchRepository'
import {relicSearchDocumentRepository} from './relicSearchRepository'
import {assertPublicScopeCapability, type SearchablePublicDataScope} from './scopeRegistry'
import {wheelSearchDocumentRepository} from './wheelSearchRepository'

export {
  createPublicSearchDocumentRepository,
  type PublicSearchDocumentRepository,
} from './publicSearchDocumentRepository'

const compatibilityRepositories = {
  awakeners: awakenerSearchDocumentRepository,
  covenants: covenantSearchDocumentRepository,
  posses: posseSearchDocumentRepository,
  relics: relicSearchDocumentRepository,
  wheels: wheelSearchDocumentRepository,
}

/** @deprecated Prefer an entity-specific repository so bundlers load only that entity's index. */
export function getPublicSearchDocuments(
  scope: SearchablePublicDataScope,
): readonly PublicSearchDocument[] {
  assertPublicScopeCapability(scope, 'search')
  return compatibilityRepositories[scope].getDocuments()
}

/** @deprecated Prefer an entity-specific repository so bundlers load only that entity's index. */
export function getPublicSearchDocument(
  scope: SearchablePublicDataScope,
  id: string,
): PublicSearchDocument | undefined {
  assertPublicScopeCapability(scope, 'search')
  return compatibilityRepositories[scope].getDocument(id)
}
