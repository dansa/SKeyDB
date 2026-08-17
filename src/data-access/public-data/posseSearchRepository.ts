import searchIndexJson from '@/data/public-v3/indexes/search-posses.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const posseSearchDocumentRepository = createPublicSearchDocumentRepository(
  'posses',
  searchIndexJson,
)
