import searchIndexJson from '@/data/public-v3/indexes/search-awakeners.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const awakenerSearchDocumentRepository = createPublicSearchDocumentRepository(
  'awakeners',
  searchIndexJson,
)
