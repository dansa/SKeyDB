import enlightensCatalogJson from '@/data/public-v3/catalogs/enlightens.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const enlightensCatalog = createPublicCatalogReader('enlightens', enlightensCatalogJson)

export const getPublicEnlightenCatalog = enlightensCatalog.getCatalog
export const getPublicEnlightenCatalogRecords = enlightensCatalog.getRecords
