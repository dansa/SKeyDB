import awakenersCatalogJson from '@/data/public-v3/catalogs/awakeners.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const awakenersCatalog = createPublicCatalogReader('awakeners', awakenersCatalogJson)

export const getPublicAwakenerCatalog = awakenersCatalog.getCatalog
export const getPublicAwakenerCatalogRecords = awakenersCatalog.getRecords
