import searchIndexJson from '@/data/public-v3/indexes/search-wheels.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const wheelSearchDocumentRepository = createPublicSearchDocumentRepository(
  'wheels',
  searchIndexJson,
)
