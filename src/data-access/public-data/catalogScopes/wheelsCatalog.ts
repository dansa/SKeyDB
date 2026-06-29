import wheelsCatalogJson from '@/data/public-v3/catalogs/wheels.json'

import {createPublicCatalogReader} from '../publicCatalogReader'

const wheelsCatalog = createPublicCatalogReader('wheels', wheelsCatalogJson)

export const getPublicWheelCatalog = wheelsCatalog.getCatalog
export const getPublicWheelCatalogRecords = wheelsCatalog.getRecords
