import searchIndexJson from '@/data/public-v3/indexes/search-orisons.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const orisonSearchDocumentRepository = createPublicSearchDocumentRepository(
  'orisons',
  searchIndexJson,
)
