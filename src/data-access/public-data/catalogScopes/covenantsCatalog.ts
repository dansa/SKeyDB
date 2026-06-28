import covenantsCatalogJson from '@/data/public-v3/catalogs/covenants.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const covenantsCatalog = createPublicCatalogReader('covenants', covenantsCatalogJson)

export const getPublicCovenantCatalog = covenantsCatalog.getCatalog
export const getPublicCovenantCatalogRecords = covenantsCatalog.getRecords
