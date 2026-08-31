import {orisonSearchDocumentRepository} from '@/data-access/public-data/orisonSearchRepository'

import type {Orison} from './orisons'
import {createEntitySearch} from './public-search'

const orisonSearch = createEntitySearch<Orison>({
  getDocument: (id) => orisonSearchDocumentRepository.getDocument(id),
  getFallbackFields: (orison) => ({
    alias: orison.aliases,
    facet: [orison.orisonType, ...orison.variantTiers],
  }),
})

export function searchOrisons(orisons: Orison[], query: string): Orison[] {
  return orisonSearch.search(orisons, query)
}
