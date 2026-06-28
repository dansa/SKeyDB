import possesCatalogJson from '@/data/public-v3/catalogs/posses.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const possesCatalog = createPublicCatalogReader('posses', possesCatalogJson)

export const getPublicPosseCatalog = possesCatalog.getCatalog
export const getPublicPosseCatalogRecords = possesCatalog.getRecords
