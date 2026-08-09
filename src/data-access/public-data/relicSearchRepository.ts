import searchIndexJson from '@/data/public-v3/indexes/search-relics.json'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'

export const relicSearchDocumentRepository = createPublicSearchDocumentRepository(
  'relics',
  searchIndexJson,
)
