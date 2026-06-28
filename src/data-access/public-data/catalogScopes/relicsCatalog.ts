import relicsCatalogJson from '@/data/public-v3/catalogs/relics.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const relicsCatalog = createPublicCatalogReader('relics', relicsCatalogJson)

export const getPublicRelicCatalog = relicsCatalog.getCatalog
export const getPublicRelicCatalogRecords = relicsCatalog.getRecords
