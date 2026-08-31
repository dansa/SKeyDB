import orisonsCatalogJson from '@/data/public-v3/catalogs/orisons.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const orisonsCatalog = createPublicCatalogReader('orisons', orisonsCatalogJson)

export const getPublicOrisonCatalog = orisonsCatalog.getCatalog
export const getPublicOrisonCatalogRecords = orisonsCatalog.getRecords
