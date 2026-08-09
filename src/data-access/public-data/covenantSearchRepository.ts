import searchIndexJson from '@/data/public-v3/indexes/search-covenants.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const covenantSearchDocumentRepository = createPublicSearchDocumentRepository(
  'covenants',
  searchIndexJson,
)
